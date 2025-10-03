import { handleGoogleSigninCallback } from "../../../lib/kv_oauth.ts";
import { withClient } from "@db/postgres-base.ts";
import { setCookie } from "cookie";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {

    try {
      console.log("1. Google signin callback received with URL:", ctx.req.url);

      // 1. Let the package handle the OAuth flow
      console.log("2. Attempting OAuth callback handling...");
      const { response, sessionId, tokens } = await handleGoogleSigninCallback(
        ctx.req,
      );
      console.log("3. OAuth callback successful:", {
        hasResponse: !!response,
        hasSession: !!sessionId,
        hasTokens: !!tokens,
        tokenType: tokens?.accessToken ? typeof tokens.accessToken : "no token",
      });

      // 2. Only after successful OAuth, handle user
      if (tokens?.accessToken) {
        console.log("4. Starting user handling with token");
        const userResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { "Authorization": `Bearer ${tokens.accessToken}` },
          },
        );
        const userData = await userResponse.json();
        console.log("5. Google API response:", userData);

        // Check if user exists
        const existingUser = await withClient(async (sql) => {
          return await sql<{ id: number }[]>`
            SELECT id FROM users WHERE provider = 'google' AND provider_id = ${userData.id}
          `;
        });

        if (!existingUser.length) {
          console.log("6. User not found, redirecting to signup");
          return new Response(null, {
            status: 303,
            headers: {
              Location:
                "/auth/signup?error=No account found. Please sign up first.",
            },
          });
        }

        const userId = existingUser[0].id;
        console.log("6. Existing user found with ID:", userId);

        // Store user session in KV
        const kv = await Deno.openKv();
        await kv.set(["sessions", sessionId], {
          $id: userId.toString(), // Store as string with $id to match expected format
          created: Date.now(),
        });

        // Create custom response with session cookie
        const newResponse = new Response(null, {
          status: 303,
          headers: { Location: "/profile" },
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

        console.log(
          "7. Redirecting to /profile with session cookie and user ID:",
          userId,
        );
        return newResponse;
      } else {
        console.log("4. No access token available");
        throw new Error("No access token received from Google");
      }
    } catch (error: unknown) {
      console.error("Google signin error:", error);

      if (error instanceof Error) {
        const errorWithOAuth = error as Error & { error?: string; errorDescription?: string };
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          oauthError: errorWithOAuth.error,
          oauthDescription: errorWithOAuth.errorDescription,
        });
      }

      return new Response(null, {
        status: 303,
        headers: { Location: "/auth/login?error=Failed to sign in" },
      });
    }
  },
});
