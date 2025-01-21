import { AIService, AIResponse } from "../../types/ai-service.types.ts";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequestOptions {
  messages: AnthropicMessage[];
  max_tokens: number;
}

/**
 * AnthropicService implements the AIService interface for interacting with Anthropic's API.
 * Provides methods for processing job postings and generating CV content using Claude.
 */
export class AnthropicService implements AIService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.anthropic.com/v1";
  private readonly model = "claude-3-sonnet-20240229";

  constructor(apiKey: string | null | undefined) {
    if (!apiKey) {
      throw new Error("service: ANTHROPIC_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  private async makeRequest(options: AnthropicRequestOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          ...options
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`request: Anthropic API error: ${error}`);
        throw new Error(`request: ${error}`);
      }

      const data = await response.json();
      return { content: [data.content[0].text] };
    } catch (error) {
      console.error("request:", error);
      return {
        content: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async processJobPosting(prompt: string): Promise<AIResponse> {
    return this.makeRequest({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024
    });
  }

  async generateCV(prompt: string): Promise<AIResponse> {
    return this.makeRequest({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048
    });
  }
} 