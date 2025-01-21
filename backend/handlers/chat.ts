import { AIService } from "../types/ai-service.types.ts";
import { ChatMessage, ChatResponse, ChatModel } from "../types/chat.ts";

export class ChatHandler {
  private readonly services: Record<string, AIService>;

  constructor(services: Record<string, AIService>) {
    this.services = services;
  }

  private getService(model: string): AIService {
    const service = this.services[model];
    if (!service) {
      throw new Error(`Unsupported model: ${model}`);
    }
    return service;
  }

  async handleMessage(
    message: string,
    model: string,
    conversationHistory: ChatMessage[]
  ): Promise<ChatResponse> {
    try {
      console.log("Processing chat message:", {
        model,
        messageLength: message.length,
        historyLength: conversationHistory.length
      });

      const service = this.getService(model);
      const response = await service.processJobPosting(message);

      if (response.error || !response.content.length) {
        console.error("Chat processing failed:", response.error);
        throw new Error(response.error || "Failed to process chat message");
      }

      return {
        content: response.content[0],
        error: null
      };
    } catch (error) {
      console.error("Chat handling error:", error);
      return {
        content: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async handleJobUrl(
    url: string,
    model: string,
    jobContent: string
  ): Promise<ChatResponse> {
    try {
      console.log("Processing job URL:", {
        model,
        url,
        contentLength: jobContent.length
      });

      const service = this.getService(model);
      const response = await service.processJobPosting(jobContent);

      if (response.error || !response.content.length) {
        console.error("Job processing failed:", response.error);
        throw new Error(response.error || "Failed to process job posting");
      }

      return {
        content: response.content[0],
        error: null
      };
    } catch (error) {
      console.error("Job URL handling error:", error);
      return {
        content: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 