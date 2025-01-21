import { HandlerContext } from "$fresh/server.ts";
import { processJobUrl } from "../../backend/utils/process-job-url.ts";
import { AnthropicService } from "../../backend/services/ai/anthropic.ts";
import { XAIService } from "../../backend/services/ai/xai.ts";
import { structureJobContent, validateJobContent, prepareCVPrompt } from "../../backend/services/job/processor.ts";

let anthropic: AnthropicService;
let xai: XAIService;

try {
  // Initialize services
  anthropic = new AnthropicService(Deno.env.get("ANTHROPIC_API_KEY"));
  xai = new XAIService(Deno.env.get("XAI_API_KEY"));
} catch (error) {
  console.error("Failed to initialize AI services:", error);
  Deno.exit(1);
}

export async function handler(
  req: Request,
  _ctx: HandlerContext,
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, conversationHistory, model = "grok" } = await req.json();
    const service = model === "grok" ? xai : anthropic;

    // Check if the message is a URL
    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(message)) {
      // Process job URL
      const jobResult = await processJobUrl(message);
      if (!jobResult.success) {
        return new Response(
          JSON.stringify({ error: jobResult.error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Structure the job content
      const structurePrompt = structureJobContent(jobResult.content);
      const structuredResponse = await service.processJobPosting(structurePrompt);

      if (structuredResponse.error || !structuredResponse.content.length) {
        return new Response(
          JSON.stringify({ error: structuredResponse.error || "Failed to process job posting" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Parse and validate the structured content
      let structuredContent;
      try {
        structuredContent = JSON.parse(structuredResponse.content[0]);
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Failed to parse structured content" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const validatedContent = validateJobContent(structuredContent);
      if (validatedContent.error) {
        return new Response(
          JSON.stringify({ error: validatedContent.error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Generate CV suggestions
      const cvPrompt = prepareCVPrompt(validatedContent);
      const cvResponse = await service.generateCV(cvPrompt);

      if (cvResponse.error || !cvResponse.content.length) {
        return new Response(
          JSON.stringify({ error: cvResponse.error || "Failed to generate CV suggestions" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          content: cvResponse.content[0],
          structuredContent: validatedContent
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle regular chat messages
    const chatResponse = await service.processJobPosting(message);
    return new Response(
      JSON.stringify({ 
        content: chatResponse.content[0]
      }),
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