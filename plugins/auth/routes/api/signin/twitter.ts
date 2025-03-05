// routes/verify/twitter/signup.tsx - Handle Twitter signup
import { Handlers } from "$fresh/server.ts";
import { handleTwitterSigninCallback } from "../../../lib/kv_oauth.ts";
import db from "@db/postgres-base.ts";
import { setCookie } from "cookie";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { response, sessionId, tokens } = await handleTwitterSigninCallback(req);
      
      // Get Twitter user info and create new user
      const userResponse = await fetch("https://api.twitter.com/2/users/me", {
        headers: { "Authorization": `Bearer ${tokens.accessToken}` }
      });
      const userData = await userResponse.json();

      // Create new user
      const result = await db.queryObject<{ id: number }>(
        `INSERT INTO runners (first_name, provider, provider_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        [userData.data.name, 'twitter', userData.data.id]
      );

      // Set session and redirect to onboarding
      const newResponse = new Response(null, {
        status: 303,
        headers: { Location: "/profile" }
      });

      setCookie(newResponse.headers, {
        name: "session",
        value: sessionId,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        path: "/",
        sameSite: "Lax",
        secure: true,
        httpOnly: true,
      });

      return newResponse;
    } catch (error) {
      console.error("Twitter signup error:", error);
      return new Response(null, {
        status: 303,
        headers: { Location: "/signup?error=Failed to create account" }
      });
    }
  }
}; 