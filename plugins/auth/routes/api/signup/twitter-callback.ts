// routes/verify/twitter/signup.tsx - Handle Twitter signup
import { Handlers } from "$fresh/server.ts";
import { handleTwitterSignupCallback } from "../../../lib/kv_oauth.ts";
import db from "@db/postgres-base.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      console.log("1. Callback received with URL:", req.url);
      
      // 1. Let the package handle the OAuth flow
      console.log("2. Attempting OAuth callback handling...");
      console.log("Request details:", {
        code: new URL(req.url).searchParams.get("code"),
        state: new URL(req.url).searchParams.get("state"),
        headers: Object.fromEntries(req.headers.entries()),
        params: Object.fromEntries(new URL(req.url).searchParams.entries()),
        oauthSession: req.headers.get("cookie"),
        stateFromCookie: req.headers.get("cookie")?.match(/oauth-session=([^;]+)/)?.[1],
        kvKey: `oauth-${req.headers.get("cookie")?.match(/oauth-session=([^;]+)/)?.[1]}`
      });
      const { response, sessionId, tokens } = await handleTwitterSignupCallback(req);
      console.log("3. OAuth callback successful:", { 
        hasResponse: !!response,
        hasSession: !!sessionId,
        hasTokens: !!tokens,
        tokenType: tokens?.accessToken ? typeof tokens.accessToken : 'no token'
      });

      // 2. Only after successful OAuth, create user
      if (tokens?.accessToken) {
        console.log("4. Starting user creation with token");
        const userResponse = await fetch("https://api.twitter.com/2/users/me", {
          headers: { "Authorization": `Bearer ${tokens.accessToken}` }
        });
        const userData = await userResponse.json();
        console.log("5. Twitter API response:", userData);

        await db.queryObject(
          `INSERT INTO runners (first_name, provider, provider_id) 
           VALUES ($1, $2, $3)`,
          [userData.data.name, 'twitter', userData.data.id]
        );
        console.log("6. User created in database");
      } else {
        console.log("4. No access token available");
      }

      // 3. Use the package's response
      console.log("7. Returning package response:", {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
      return response;

    } catch (error: unknown) {
      console.error("Twitter signup error:", error);
      
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // Log any additional OAuth-specific properties
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