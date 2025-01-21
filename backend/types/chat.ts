export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  model?: string;
}

export interface ChatResponse {
  content: string | null;
  error: string | null;
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

export type ChatModel = "anthropic" | "xai" | "deepseek" | "openai"; 