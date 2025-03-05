/* Apple Authentication - Commented out until Apple Developer Account is set up
import { Handlers } from "$fresh/server.ts";
import { signInWithAppleSignup } from "../../../../lib/auth/kv_oauth.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signInWithAppleSignup(req);
  }
}; 
*/ 