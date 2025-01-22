import { FreshContext } from "$fresh/server.ts";
import { config } from "../../config.ts";

export async function handler(
  req: Request,
  _ctx: FreshContext,
): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    console.log("Fetching joke from API Ninjas...");
    const response = await fetch('https://api.api-ninjas.com/v1/jokes', {
      headers: {
        'X-Api-Key': config.api_ninjas_key.trim(),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('API Ninjas response not ok:', await response.text());
      throw new Error(`API responded with status ${response.status}`);
    }

    const jokes = await response.json();
    console.log("Received joke:", jokes);
    const joke = jokes[0]?.joke || "Why did the AI cross the road? To get to the other dataset!";

    return new Response(
      JSON.stringify({ content: joke }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Joke API error details:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        content: "Why did the AI cross the road? To get to the other dataset!"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 