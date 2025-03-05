import { signInWithTwitterSignup } from "../../../lib/kv_oauth.ts";
import { Handlers } from "$fresh/server.ts";

async function generateCodeVerifier() {
  const rando = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...rando))
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 128);
}

export const handler: Handlers = {
  async GET(req) {
    try {
      console.log("Initial Twitter auth request:", {
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        cookies: req.headers.get("cookie"),
      });

      return await signInWithTwitterSignup(req);
    } catch (error) {
      console.error("Twitter auth initiation error:", error);
      return new Response(null, {
        status: 303,
        headers: { Location: "/signup?error=Twitter+auth+failed" }
      });
    }
  },
};