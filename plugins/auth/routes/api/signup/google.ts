import { Handlers } from "$fresh/server.ts";
import { signInWithGoogleSignup } from "../../../lib/kv_oauth.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signInWithGoogleSignup(req);
  }
}; 