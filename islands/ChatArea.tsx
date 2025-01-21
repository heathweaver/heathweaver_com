import { useSignal } from "@preact/signals";
import { ChatMessage, StreamChunk } from "../backend/types/chat.ts";

export default function ChatArea() {
  const messages = useSignal<ChatMessage[]>([{
    role: "assistant",
    content: "Hi, I am Heath's virtual assistant. I am responsible for creating a CV/Resume that's tailored to the role you have available. Would you like to begin?"
  }]);
  const inputValue = useSignal("");
  const isLoading = useSignal(false);
  const currentModel = useSignal<"anthropic" | "xai">("anthropic");
  const showJobInput = useSignal(false);
  const jobUrl = useSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!inputValue.value.trim() || isLoading.value) return;

    const userMessage = inputValue.value;
    inputValue.value = "";
    isLoading.value = true;

    // Check if the message is a URL
    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(userMessage)) {
      // Handle as job URL
      jobUrl.value = userMessage;
      messages.value = [...messages.value, {
        role: "user",
        content: `I'd like to analyze this job posting: ${userMessage}`,
      }];
    } else {
      messages.value = [...messages.value, {
        role: "user",
        content: userMessage,
      }];
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory: messages.value.filter(m => m.role !== "system"),
          model: currentModel.value
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      // Add empty assistant message that we'll stream into
      messages.value = [...messages.value, {
        role: "assistant",
        content: "",
      }];

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from the buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove "data: " prefix
            if (data === "[DONE]") continue;

            try {
              const chunk: StreamChunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;
              
              if (content) {
                const lastMessage = messages.value[messages.value.length - 1];
                messages.value = [
                  ...messages.value.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + content },
                ];
              }
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div class="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-lg p-4">
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.value.map((msg, i) => (
          <div key={i} class={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div class={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === "user" 
                ? "bg-emerald-600 text-white" 
                : "bg-gray-100 text-slate-800"
            }`}>
              {msg.content || (isLoading.value && msg.role === "assistant" && "...")}
            </div>
          </div>
        ))}
      </div>
      
      <div class="p-4 border-t">
        <div class="flex flex-col gap-2">
          {showJobInput.value && (
            <div class="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="text"
                value={jobUrl.value}
                onChange={(e) => jobUrl.value = e.currentTarget.value}
                class="flex-1 bg-transparent border-none focus:outline-none text-slate-800 placeholder-gray-500"
                placeholder="Paste job URL here..."
              />
              <button
                onClick={() => {
                  if (jobUrl.value) {
                    inputValue.value = jobUrl.value;
                    handleSubmit(new Event('submit'));
                  }
                  showJobInput.value = false;
                }}
                class="text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  showJobInput.value = false;
                  jobUrl.value = "";
                }}
                class="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <button
                onClick={() => showJobInput.value = true}
                class="text-emerald-600 hover:text-emerald-700 transition-colors px-2 text-xl"
              >
                +
              </button>
              <input
                type="text"
                value={inputValue.value}
                onChange={(e) => inputValue.value = e.currentTarget.value}
                disabled={isLoading.value}
                class="flex-1 px-4 py-2 bg-white rounded-xl border border-gray-200 focus:border-emerald-600 transition-colors disabled:opacity-50"
                placeholder={isLoading.value ? "AI is thinking..." : "Type your message..."}
              />
            </div>
            <div class="flex items-center gap-2">
              <div class="min-w-[140px]">
                <select
                  value={currentModel.value}
                  onChange={(e) => {
                    currentModel.value = e.currentTarget.value as "anthropic" | "xai";
                  }}
                  class="w-full px-3 py-1.5 rounded-xl text-sm text-slate-600 bg-white border border-gray-200 hover:border-emerald-600 focus:border-emerald-600 transition-colors appearance-none cursor-pointer"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="xai">xAI</option>
                </select>
              </div>
              <div class="flex-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading.value}
                  onClick={handleSubmit}
                  class="px-6 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 