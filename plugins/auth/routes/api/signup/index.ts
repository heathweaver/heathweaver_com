import { FreshContext } from "$fresh/server.ts";

export async function handler(
  req: Request,
  _ctx: FreshContext,
) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email } = await req.json();
    
    // TODO: Replace with KV storage
    const kv = await Deno.openKv();
    const token = crypto.randomUUID();
    await kv.set(["signup_tokens", token], { email, created: Date.now() });

    // Send magic link email (implement this)
    // await sendSignupEmail(email, token);

    return new Response(JSON.stringify({ success: true }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400 }
    );
  }
} 