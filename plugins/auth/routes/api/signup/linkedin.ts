import { signInWithLinkedInSignup } from "../../../lib/kv_oauth.ts";
import { Handlers } from "fresh/compat";

export const handler: Handlers = {
  async GET(ctx) {
    const req = ctx.req;

    return await signInWithLinkedInSignup(req);
  },
};
