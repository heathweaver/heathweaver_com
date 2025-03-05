/* Apple Authentication - Commented out until Apple Developer Account is set up
import { Handlers } from "$fresh/server.ts";
import { handleAppleSignupCallback } from "../../../../lib/auth/kv_oauth.ts";
import db from "../../../../lib/database/postgres-base.ts";
import { setCookie } from "cookie";

export const handler: Handlers = {
  async GET(req) {
    try {
      console.log("1. Apple callback received with URL:", req.url);
      
      // 1. Let the package handle the OAuth flow
      console.log("2. Attempting OAuth callback handling...");
      const { response, sessionId, tokens } = await handleAppleSignupCallback(req);
      console.log("3. OAuth callback successful:", { 
        hasResponse: !!response,
        hasSession: !!sessionId,
        hasTokens: !!tokens,
        tokenType: tokens?.accessToken ? typeof tokens.accessToken : 'no token'
      });

      // 2. Only after successful OAuth, handle user
      if (tokens?.accessToken) {
        console.log("4. Starting user handling with token");
        // Apple's user info is included in the ID token, we need to decode it
        const userData = JSON.parse(atob(tokens.idToken.split('.')[1]));
        console.log("5. Apple ID token payload:", userData);

        // Check if user exists
        const existingUser = await db.queryObject<{ id: number }>(
          `SELECT id FROM runners WHERE provider = $1 AND provider_id = $2`,
          ['apple', userData.sub]
        );

        let redirectPath = "/profile"; // Default for new users
        let userId: number;

        if (!existingUser.rows.length) {
          // Create new user if they don't exist
          const result = await db.queryObject<{ id: number }>(
            `INSERT INTO runners (first_name, provider, provider_id) 
             VALUES ($1, $2, $3) RETURNING id`,
            [userData.name || 'Apple User', 'apple', userData.sub]
          );
          userId = result.rows[0].id;
          console.log("6. New user created in database with ID:", userId);
        } else {
          userId = existingUser.rows[0].id;
          console.log("6. Existing user found with ID:", userId);
          redirectPath = "/coach"; // Redirect existing users to coach page
        }

        // Store user session in KV
        const kv = await Deno.openKv();
        await kv.set(["sessions", sessionId], {
          $id: userId.toString(), // Store as string with $id to match expected format
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
        throw new Error("No access token received from Apple");
      }

    } catch (error: unknown) {
      console.error("Apple signup error:", error);
      
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
*/ 