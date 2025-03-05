import { Handlers } from "$fresh/server.ts";
import { handleGoogleSigninCallback } from "../../../lib/kv_oauth.ts";
import { withClient } from "@db/postgres-base.ts";
import { setCookie } from "cookie";

export const handler: Handlers = {
  async GET(req) {
    try {
      console.log("1. Google signin callback received with URL:", req.url);
      
      // 1. Let the package handle the OAuth flow
      console.log("2. Attempting OAuth callback handling...");
      const { response, sessionId, tokens } = await handleGoogleSigninCallback(req);
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

        // Check if user exists
        const existingUser = await withClient(async (client) => {
          return await client.queryObject<{ id: number }>(
            `SELECT id FROM users WHERE provider = $1 AND provider_id = $2`,
            ['google', userData.id]
          );
        });

        if (!existingUser.rows.length) {
          console.log("6. User not found, redirecting to signup");
          return new Response(null, {
            status: 303,
            headers: { Location: "/auth/signup?error=No account found. Please sign up first." }
          });
        }

        const userId = existingUser.rows[0].id;
        console.log("6. Existing user found with ID:", userId);

        // Store user session in KV
        const kv = await Deno.openKv();
        await kv.set(["sessions", sessionId], {
          $id: userId.toString(), // Store as string with $id to match expected format
          created: Date.now()
        });

        // Create custom response with session cookie
        const newResponse = new Response(null, {
          status: 303,
          headers: { Location: "/profile" }
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

        console.log("7. Redirecting to /profile with session cookie and user ID:", userId);
        return newResponse;
      } else {
        console.log("4. No access token available");
        throw new Error("No access token received from Google");
      }

    } catch (error: unknown) {
      console.error("Google signin error:", error);
      
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
        headers: { Location: "/auth/login?error=Failed to sign in" }
      });
    }
  }
}; 