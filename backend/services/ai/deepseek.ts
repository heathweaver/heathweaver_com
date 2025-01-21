import { AIService, AIResponse } from "../../types/ai-service.types.ts";
import { AI_SERVICE_SYSTEM_PROMPT } from "../../prompt/index.ts";

interface DeepSeekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface DeepSeekRequestOptions {
  messages: DeepSeekMessage[];
  model: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * DeepSeekService implements the AIService interface for interacting with DeepSeek's API.
 * Provides methods for processing job postings and generating CV content.
 */
export class DeepSeekService implements AIService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.deepseek.com/v1";
  private readonly model: string;

  constructor(apiKey: string | null | undefined, model = "deepseek-chat") {
    if (!apiKey) {
      throw new Error("service: DEEPSEEK_API_KEY is required");
    }
    this.apiKey = apiKey;
    this.model = model;
    console.log(`DeepSeek service initialized with model: ${model}`);
  }

  private async makeRequest(options: DeepSeekRequestOptions): Promise<AIResponse> {
    try {
      console.log("Making DeepSeek API request:", {
        url: `${this.baseUrl}/chat/completions`,
        model: this.model,
        messageCount: options.messages.length,
      });

      // Add system message to the beginning of messages
      const messages = [
        {
          role: "system",
          content: AI_SERVICE_SYSTEM_PROMPT
        },
        ...options.messages
      ];

      const requestBody = {
        model: this.model,
        messages,
        max_tokens: options.max_tokens || 2048,
        temperature: options.temperature || 0.7,
        stream: false
      };
      
      console.log("Request body:", JSON.stringify(requestBody));

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      if (!response.ok) {
        console.error(`DeepSeek API error: Status ${response.status}`, responseText);
        throw new Error(`request: DeepSeek API error: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse DeepSeek response:", e);
        throw new Error("Failed to parse DeepSeek response");
      }

      console.log("Parsed response data:", data);

      if (!data.choices?.[0]?.message?.content) {
        console.error("Unexpected response structure:", data);
        throw new Error("Unexpected response structure from DeepSeek");
      }

      return { content: [data.choices[0].message.content] };
    } catch (error) {
      console.error("DeepSeek request error:", error);
      return {
        content: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async processJobPosting(prompt: string): Promise<AIResponse> {
    console.log("Processing job posting with DeepSeek:", { promptLength: prompt.length });
    return this.makeRequest({
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      max_tokens: 1024,
      temperature: 0.7
    });
  }

  async generateCV(prompt: string): Promise<AIResponse> {
    console.log("Generating CV with DeepSeek:", { promptLength: prompt.length });
    return this.makeRequest({
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      max_tokens: 2048,
      temperature: 0.7
    });
  }
} 