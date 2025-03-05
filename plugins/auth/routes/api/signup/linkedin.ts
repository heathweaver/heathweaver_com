import { Handlers } from "$fresh/server.ts";
import { signInWithLinkedInSignup } from "../../../lib/kv_oauth.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signInWithLinkedInSignup(req);
  }
}; 