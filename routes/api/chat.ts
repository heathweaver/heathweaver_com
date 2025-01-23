import { FreshContext } from "$fresh/server.ts";
import { processJobUrl } from "../../backend/utils/process-job-url.ts";
import { AnthropicService } from "../../backend/services/ai/anthropic.ts";
import { XAIService } from "../../backend/services/ai/xai.ts";
import { DeepSeekService } from "../../backend/services/ai/deepseek.ts";
import { ChatHandler } from "../../backend/handlers/chat.ts";
import { ChatModel } from "../../backend/types/chat.ts";

// Initialize AI services
const services: Record<string, AnthropicService | XAIService | DeepSeekService> = {
  anthropic: new AnthropicService(Deno.env.get("ANTHROPIC_API_KEY")),
  xai: new XAIService(Deno.env.get("XAI_API_KEY")),
  deepseek: new DeepSeekService(Deno.env.get("DEEPSEEK_API_KEY"))
};

// Initialize chat handler
const chatHandler = new ChatHandler(services);

export async function handler(
  req: Request,
  _ctx: FreshContext,
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, conversationHistory, model = "anthropic" } = await req.json();
    
    console.log("Chat request received:", {
      model,
      messageLength: message.length,
      conversationHistoryLength: conversationHistory.length
    });

    // Check if the message is a URL
    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(message)) {
      console.log("Processing URL:", message);
      
      const jobResult = await processJobUrl(message);
      if (!jobResult.success || !jobResult.content) {
        console.error("Job URL processing failed:", jobResult.error);
        return new Response(
          JSON.stringify({ error: jobResult.error || "No content found in job posting" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const response = await chatHandler.handleJobUrl(message, model as ChatModel, jobResult.content);
      
      if (response.error) {
        return new Response(
          JSON.stringify({ error: response.error }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ content: response.content }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle regular chat messages
    const response = await chatHandler.handleMessage(message, model as ChatModel, conversationHistory);
    
    if (response.error) {
      return new Response(
        JSON.stringify({ error: response.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ content: response.content }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Handler error:", error);
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