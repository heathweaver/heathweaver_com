export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  model?: string;
}

export interface StreamChunk {
  choices: {
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }[];
} 