import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { Handlers, HandlerContext } from "$fresh/server.ts";
import { ChatRequest } from "../../backend/types/chat.ts";
import { processJobUrl } from "../../backend/utils/process-job-url.ts";

const client = new OpenAI();

const INITIAL_PROMPT = `You are Heath's virtual assistant, specifically designed to create customized CVs and cover letters. Your interaction style is professional but friendly. If you are asked to do anything outside of this, politely decline and ask them if they'd like to begin with the creation of a CV. Unless this is Heath, then you can discuss whatever he wants.

Follow these steps:
1. First introduce yourself and ask if they'd like to begin
2. Once they agree, ask for a link to the job description for the role where Heath might be a good fit.
3. Based on their response, ask relevant questions about the role to better customize the CV
4. Before generating the final CV, confirm with the user
5. Only generate the CV when explicitly requested

Remember: Heath's basic information and job history are constant, but the presentation and emphasis should be customized for each role.
If they provide a link from LinkedIn, let them know that unfortunately LinkedIn doesn't allow us to access their job descriptions, so it would need to be a link to the job description from the company's website.`;

export async function handler(
  req: Request,
  _ctx: HandlerContext,
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, conversationHistory } = await req.json();

    // Check if the message is a URL
    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(message)) {
      const jobResult = await processJobUrl(message);
      if (!jobResult.success) {
        return new Response(
          JSON.stringify({ error: jobResult.error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      // For now, just return the job content for testing
      return new Response(
        JSON.stringify({ 
          content: jobResult.content,
          debug: jobResult.debug
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle regular chat messages here...
    return new Response(
      JSON.stringify({ message: "Regular chat message handling not implemented yet" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
} 