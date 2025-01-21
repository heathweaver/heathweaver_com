import { useSignal } from "@preact/signals";
import { ChatMessage, StreamChunk } from "../backend/types/chat.ts";

export default function ChatArea() {
  const messages = useSignal<ChatMessage[]>([{
    role: "assistant",
    content: "Hi, I am Heath's virtual assistant. I am responsible for creating a CV/Resume that's tailored to the role you have available. Would you like to begin?"
  }]);
  const inputValue = useSignal("");
  const isLoading = useSignal(false);
  const currentModel = useSignal<"xai" | "anthropic" | "deepseek" | "openai">("xai");
  const showJobInput = useSignal(false);
  const jobUrl = useSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!inputValue.value.trim() || isLoading.value) return;

    const userMessage = inputValue.value;
    inputValue.value = "";
    isLoading.value = true;

    messages.value = [...messages.value, {
      role: "user",
      content: userMessage,
    }];

    try {
      const response = await fetch(`/api/${currentModel.value}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      messages.value = [...messages.value, {
        role: "assistant",
        content: data.content,
      }];
    } catch (error) {
      console.error("Chat error:", error);
      messages.value = [...messages.value, {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }];
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
        <form onSubmit={handleSubmit} class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
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
            <div class="min-w-[140px] relative">
              <select
                value={currentModel.value}
                onChange={(e) => {
                  currentModel.value = e.currentTarget.value as "xai" | "anthropic" | "deepseek" | "openai";
                }}
                class="w-full pl-8 pr-3 py-1.5 rounded-xl text-sm text-slate-600 bg-transparent appearance-none cursor-pointer focus:outline-none"
              >
                <option value="xai">xAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-slate-600">
                <svg class="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>
            <div class="flex-1 flex justify-end">
              <button
                type="submit"
                disabled={isLoading.value}
                class="px-6 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 