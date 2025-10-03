export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string[];
  error?: string;
}

export interface AIRequestOptions {
  prompt: string;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>;
}

export interface AIService {
  /**
   * Process a prompt and return a response.
   * @param prompt The prompt to process
   * @param jsonSchema Optional schema if JSON response is required
   */
  processJobPosting(
    prompt: string,
    jsonSchema?: Record<string, unknown>,
  ): Promise<AIResponse>;
}
