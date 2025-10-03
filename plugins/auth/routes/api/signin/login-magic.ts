export const handler = async (req: Request) => {
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const email = formData.get("email") as string;
      console.log("Magic login attempt for email:", email);

      const { account } = createAdminClient();
      console.log("Admin client created");

      const session = await account.createMagicURLToken(
        ID.unique(),
        email,
        `${new URL(req.url).origin}/verify`,
      );
      console.log("Magic URL session created:", session);

      return new Response(null, {
        status: 303,
        headers: {
          Location: "/auth/login?message=Check your email for a login link",
        },
      });
    } catch (error) {
      console.error("Magic URL error details:", {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
      });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
