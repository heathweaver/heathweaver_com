import { Handlers } from "$fresh/server.ts";
import { signInWithLinkedInSignin } from "../../../lib/kv_oauth.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signInWithLinkedInSignin(req);
  }
}; 