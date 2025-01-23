import { FreshContext } from "$fresh/server.ts";
import "$std/dotenv/load.ts";
import { VERIFIED_PROMPT } from "../../backend/prompt/index.ts";

export async function handler(
  req: Request,
  _ctx: FreshContext,
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "XAI API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { message } = await req.json();

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: VERIFIED_PROMPT
          },
          { role: "user", content: message }
        ],
        max_tokens: 1024
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 