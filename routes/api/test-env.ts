import { FreshContext } from "$fresh/server.ts";
import "$std/dotenv/load.ts";

export function handler(
  _req: Request,
  _ctx: FreshContext,
): Response {
  const envValue = {
    postgresHost: Deno.env.get("POSTGRES_HOST"),
    postgresDb: Deno.env.get("POSTGRES_DB"),
    nodeEnv: Deno.env.get("DENO_ENV"),
    anthropicKey: Deno.env.get("ANTHROPIC_API_KEY")?.slice(0, 10) + "...",
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(envValue, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
} 