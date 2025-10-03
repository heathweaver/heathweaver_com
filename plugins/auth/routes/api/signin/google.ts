import { signInWithGoogleSignin } from "../../../lib/kv_oauth.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    return await signInWithGoogleSignin(ctx.req);
  },
});
