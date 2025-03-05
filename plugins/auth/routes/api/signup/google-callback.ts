import { Handlers } from "$fresh/server.ts";
import { handleGoogleSignupCallback } from "../../../lib/kv_oauth.ts";
import { createUser, getUserByProviderId } from "@db/user-db.ts";
import { setCookie } from "cookie";

export const handler: Handlers = {
  async GET(req) {
    try {
      console.log("1. Google callback received with URL:", req.url);
      
      // 1. Let the package handle the OAuth flow
      console.log("2. Attempting OAuth callback handling...");
      const { response, sessionId, tokens } = await handleGoogleSignupCallback(req);
      console.log("3. OAuth callback successful:", { 
        hasResponse: !!response,
        hasSession: !!sessionId,
        hasTokens: !!tokens,
        tokenType: tokens?.accessToken ? typeof tokens.accessToken : 'no token'
      });

      // 2. Only after successful OAuth, handle user
      if (tokens?.accessToken) {
        console.log("4. Starting user handling with token");
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { "Authorization": `Bearer ${tokens.accessToken}` }
        });
        const userData = await userResponse.json();
        console.log("5. Google API response:", userData);

        // Check if user exists using user-db
        const existingUser = await getUserByProviderId("google", userData.id);
        let redirectPath = "/profile"; // Default for new users
        let userId: string;

        if (!existingUser) {
          // Create new user if they don't exist using user-db
          const newUser = await createUser({
            email: userData.email,
            firstName: userData.given_name,
            lastName: userData.family_name,
            provider: "google",
            providerId: userData.id,
            profileData: {
              avatarUrl: userData.picture,
            },
          });
          userId = newUser.id;
          console.log("6. New user created in database with ID:", userId);
        } else {
          userId = existingUser.id;
          console.log("6. Existing user found with ID:", userId);
          redirectPath = "/coach"; // Redirect existing users to coach page
        }

        // Store user session in KV
        const kv = await Deno.openKv();
        await kv.set(["sessions", sessionId], {
          $id: userId, // Store as string with $id to match expected format
          created: Date.now()
        });

        // Create custom response with session cookie
        const newResponse = new Response(null, {
          status: 303,
          headers: { Location: redirectPath }
        });

        // Set the session cookie
        setCookie(newResponse.headers, {
          name: "session",
          value: sessionId,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          path: "/",
          sameSite: "Lax",
          secure: true,
          httpOnly: true,
        });

        console.log(`7. Redirecting to ${redirectPath} with session cookie and user ID:`, userId);
        return newResponse;
      } else {
        console.log("4. No access token available");
        throw new Error("No access token received from Google");
      }

    } catch (error: unknown) {
      console.error("Google signup error:", error);
      
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          oauthError: (error as any).error,
          oauthDescription: (error as any).errorDescription
        });
      }

      return new Response(null, {
        status: 303,
        headers: { Location: "/signup?error=Failed to create account" }
      });
    }
  }
}; 