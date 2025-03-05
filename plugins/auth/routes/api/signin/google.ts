import { Handlers } from "$fresh/server.ts";
import { signInWithGoogleSignin } from "../../../lib/kv_oauth.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signInWithGoogleSignin(req);
  }
}; 