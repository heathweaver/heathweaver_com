import { signInWithGoogleSignup } from "../../../lib/kv_oauth.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    return await signInWithGoogleSignup(ctx.req);
  },
});
