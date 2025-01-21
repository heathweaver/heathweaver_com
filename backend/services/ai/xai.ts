import { AIService, AIResponse } from "../../types/ai-service.types.ts";

interface XAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface XAIRequestOptions {
  messages: XAIMessage[];
  max_tokens?: number;
  response_format?: {
    type: "json_object";
    schema: Record<string, unknown>;
  };
}

/**
 * XAIService implements the AIService interface for interacting with X.AI's API.
 * Provides methods for processing job postings and generating CV content.
 */
export class XAIService implements AIService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.x.ai/v1";
  private readonly model = "grok-2-1212";

  constructor(apiKey: string | null | undefined) {
    if (!apiKey) {
      throw new Error("service: XAI_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  private async makeRequest(options: XAIRequestOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          ...options
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`request: xAI API error: ${error}`);
        throw new Error(`request: ${error}`);
      }

      const data = await response.json();
      return { content: [data.choices[0].message.content] };
    } catch (error) {
      console.error("request:", error);
      return {
        content: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async processJobPosting(prompt: string, jsonSchema?: Record<string, unknown>): Promise<AIResponse> {
    const options: XAIRequestOptions = {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024
    };

    if (jsonSchema) {
      options.response_format = {
        type: "json_object",
        schema: jsonSchema
      };
    }

    return this.makeRequest(options);
  }

  async generateCV(prompt: string): Promise<AIResponse> {
    return this.makeRequest({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048
    });
  }
} 