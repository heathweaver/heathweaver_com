import { useSignal } from "@preact/signals";
import { ChatMessage } from "../backend/types/chat.ts";
import { INITIAL_PROMPT } from "../backend/prompt/index.ts";

export default function ChatArea() {
  const messages = useSignal<ChatMessage[]>([{
    role: "assistant",
    content:
      "Hi! I can help you create and customize your CV. Would you like to:",
  }]);
  const inputValue = useSignal("");
  const isLoading = useSignal(false);
  const currentModel = useSignal<"xai" | "anthropic" | "deepseek" | "openai">(
    "xai",
  );
  const showJobInput = useSignal(false);
  const verificationData = useSignal<
    {
      isValid: boolean;
      mode: "initial" | "verified" | "jokes";
      jobData?: Record<string, unknown>;
      cvData?: Record<string, unknown>;
    } | null
  >(null);

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
      // If not verified yet, try to verify the code
      if (!verificationData.value) {
        // If they don't provide what looks like a code (at least 8 chars), go straight to jokes
        if (
          userMessage.toLowerCase().includes("joke") || userMessage.length < 8
        ) {
          verificationData.value = {
            isValid: true,
            mode: "jokes",
            jobData: undefined,
            cvData: undefined,
          };

          const jokeResponse = await fetch("/api/joke");
          if (!jokeResponse.ok) throw new Error("Failed to fetch joke");

          const jokeData = await jokeResponse.json();
          messages.value = [...messages.value, {
            role: "assistant",
            content:
              `Here's a joke: ${jokeData.content}\n\nYou can provide the code at any time to discuss Heath's career.`,
          }];
          return;
        }

        // Try to verify the code if it looks like one
        const verifyResponse = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: userMessage }),
        });

        const data = await verifyResponse.json();

        if (!data.isValid) {
          verificationData.value = {
            isValid: true,
            mode: "jokes",
            jobData: undefined,
            cvData: undefined,
          };

          const jokeResponse = await fetch("/api/joke");
          if (!jokeResponse.ok) throw new Error("Failed to fetch joke");

          const jokeData = await jokeResponse.json();
          messages.value = [...messages.value, {
            role: "assistant",
            content:
              `That code wasn't valid, but here's a joke instead: ${jokeData.content}\n\nYou can provide a code at any time.`,
          }];
          return;
        }

        verificationData.value = data;
      }

      // If in joke mode, fetch a joke
      if (verificationData.value.mode === "jokes") {
        const jokeResponse = await fetch("/api/joke");
        if (!jokeResponse.ok) throw new Error("Failed to fetch joke");

        const jokeData = await jokeResponse.json();
        messages.value = [...messages.value, {
          role: "assistant",
          content:
            `Here's another joke: ${jokeData.content}\n\nRemember, you can provide the code at any time to discuss Heath's career.`,
        }];
        return;
      }

      // For verified mode, make the AI request with the verification data
      const response = await fetch(`/api/${currentModel.value}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          verificationData: verificationData.value,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response from AI");

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
      // Don't show technical errors to the user, just continue with joke mode
      verificationData.value = {
        isValid: true,
        mode: "jokes",
        jobData: undefined,
        cvData: undefined,
      };
      messages.value = [...messages.value, {
        role: "assistant",
        content:
          "I couldn't verify that code, but I'd be happy to tell you some jokes instead! Would you like to hear one?",
      }];
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div class="flex flex-col h-[calc(100vh-16rem)] bg-white rounded-2xl shadow-sm">
      {/* Chat messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.value.map((msg, i) => (
          <div
            key={i}
            class={`flex items-start space-x-3 ${
              msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {msg.role === "assistant" && (
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span class="text-sm font-medium text-emerald-600">AI</span>
                </div>
              </div>
            )}
            <div class={`flex-1 max-w-[80%]`}>
              <div
                class={`p-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white ml-auto"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p class="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoading.value && (
          <div class="flex items-center space-x-2">
            <div
              class="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
              style="animation-delay: 0s"
            />
            <div
              class="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
              style="animation-delay: 0.1s"
            />
            <div
              class="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
              style="animation-delay: 0.2s"
            />
          </div>
        )}
      </div>

      {/* Chat input */}
      <div class="border-t p-4">
        <form onSubmit={handleSubmit} class="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue.value}
            onChange={(e) => inputValue.value = e.currentTarget.value}
            disabled={isLoading.value}
            class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
            placeholder={isLoading.value
              ? "AI is thinking..."
              : "Ask me anything about your CV..."}
          />
          <button
            type="submit"
            disabled={isLoading.value}
            class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
