import { AIService, AIResponse } from "../../types/ai-service.types.ts";
import { AI_SERVICE_SYSTEM_PROMPT } from "../../prompt/index.ts";

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

  constructor(providedKey?: string) {
    const apiKey = providedKey || Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("service: ANTHROPIC_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  private async makeRequest(options: AnthropicRequestOptions): Promise<AIResponse> {
    try {
      console.log("Making Anthropic API request:", {
        url: `${this.baseUrl}/messages`,
        messageCount: options.messages.length,
      });

      const requestBody = {
        model: this.model,
        messages: options.messages,
        max_tokens: options.max_tokens,
        system: AI_SERVICE_SYSTEM_PROMPT
      };

      console.log("Request body:", JSON.stringify(requestBody));

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      if (!response.ok) {
        console.error(`Anthropic API error: Status ${response.status}`, responseText);
        throw new Error(`request: Anthropic API error: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Anthropic response:", e);
        throw new Error("Failed to parse Anthropic response");
      }

      console.log("Parsed response data:", data);

      if (!data.content?.[0]?.text) {
        console.error("Unexpected response structure:", data);
        throw new Error("Unexpected response structure from Anthropic");
      }

      return { content: [data.content[0].text] };
    } catch (error) {
      console.error("Anthropic request error:", error);
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