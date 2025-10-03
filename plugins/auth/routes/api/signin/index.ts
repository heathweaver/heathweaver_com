import { FreshContext } from "fresh";
import { setCookie } from "cookie";
import { Handlers } from "fresh/compat";

export const handler: Handlers = {
  async GET(ctx) {
    const req = ctx.req;

    // Redirect to sign in
    return new Response(null, {
      status: 303,
      headers: { Location: "/auth/login" },
    });
  },

  async POST(ctx: FreshContext) {
    const req = ctx.req;

    try {
      const formData = await req.formData();
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // TODO: Replace Appwrite session creation with KV
      const session = {
        secret: "temp-session",
        expire: Date.now() + 24 * 60 * 60 * 1000,
      };

      if (!session || !session.secret) {
        throw new Error("Failed to create session");
      }

      const response = new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });

      setCookie(response.headers, {
        name: "session",
        value: session.secret,
        expires: new Date(session.expire),
        path: "/",
        sameSite: "Lax",
        secure: true,
        httpOnly: true,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "An unknown error occurred";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
