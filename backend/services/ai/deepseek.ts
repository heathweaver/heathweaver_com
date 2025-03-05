import { AIService, AIResponse } from "../../types/ai-service.types.ts";
import { AI_SERVICE_SYSTEM_PROMPT } from "../../prompt/index.ts";

interface DeepSeekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface DeepSeekRequestOptions {
  messages: DeepSeekMessage[];
  model?: string;
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
  private readonly baseUrl = "https://api.deepseek.com/chat/completions";
  private readonly model: string;

  constructor(apiKey: string | null | undefined, model = "deepseek-chat") {
    if (!apiKey) {
      throw new Error("service: DEEPSEEK_API_KEY is required");
    }
    this.apiKey = apiKey;
    this.model = model;
    console.log(`DeepSeek service initialized with model: ${model}`);
  }

  private async makeRequest(messages: DeepSeekMessage[], options: { requiresJson?: boolean } = {}): Promise<AIResponse> {
    if (!this.apiKey) {
      console.error("DeepSeek API key not found");
      return { error: "DeepSeek API key not found", content: [] };
    }

    console.log("Making DeepSeek API request:", {
      url: this.baseUrl,
      model: this.model,
      messageCount: messages.length
    });

    const requestBody = {
      model: this.model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: false,
      ...(options.requiresJson && {
        response_format: { type: 'json_object' }
      })
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      if (!response.ok) {
        console.error("DeepSeek API error:", responseText);
        throw new Error(`DeepSeek API error: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse DeepSeek response:", e);
        console.error("Raw response text:", responseText);
        throw new Error(`Failed to parse DeepSeek response. Raw response: ${responseText.slice(0, 500)}...`);
      }

      if (!data.choices?.[0]?.message?.content) {
        console.error("Unexpected response structure:", data);
        throw new Error(`Unexpected response structure from DeepSeek: ${JSON.stringify(data)}`);
      }

      return {
        content: [data.choices[0].message.content]
      };
    } catch (error) {
      console.error("DeepSeek request error:", error);
      return { error: String(error), content: [] };
    }
  }

  async processJobPosting(prompt: string): Promise<AIResponse> {
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content: AI_SERVICE_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // console.log("Processing job posting with DeepSeek:", { promptLength: prompt.length });
    return await this.makeRequest(messages, { requiresJson: prompt.toLowerCase().includes('json') });
  }

  async generateCV(prompt: string): Promise<AIResponse> {
    // console.log("Generating CV with DeepSeek:", { promptLength: prompt.length });
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content: AI_SERVICE_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ];
    return await this.makeRequest(messages);
  }
} 