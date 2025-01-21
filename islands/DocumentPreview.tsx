import { useSignal } from "@preact/signals";

export default function DocumentPreview() {
  const document = useSignal<string>("");
  
  return (
    <div class="h-[calc(100vh-140px)] bg-white/70 backdrop-blur-sm rounded-2xl p-6">
      <div class="h-full">
        <div class="border-3 border-dashed border-[#40CCC3]/30 rounded-xl p-6 h-full">
          {document.value ? (
            <div class="prose max-w-none">
              {document.value}
            </div>
          ) : (
            <div class="flex items-center justify-center h-full">
              <p class="text-[#9C89B8] text-lg text-center">
                Your CV and cover letter will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 