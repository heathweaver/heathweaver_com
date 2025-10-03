import { FreshContext } from "fresh";
import "$std/dotenv/load.ts";

export async function handler(
  _ctx: FreshContext,
): Promise<Response> {
  const req = ctx.req;

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Deno.env.get("NINJAS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API Ninjas key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    console.log("Fetching joke from API Ninjas...");
    const response = await fetch("https://api.api-ninjas.com/v1/jokes", {
      headers: {
        "X-Api-Key": apiKey.trim(),
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("API Ninjas response not ok:", await response.text());
      throw new Error(`API responded with status ${response.status}`);
    }

    const jokes = await response.json();
    console.log("Received joke:", jokes);
    const joke = jokes[0]?.joke ||
      "Why did the AI cross the road? To get to the other dataset!";

    return new Response(
      JSON.stringify({ content: joke }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Joke API error details:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        content: "Why did the AI cross the road? To get to the other dataset!",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
