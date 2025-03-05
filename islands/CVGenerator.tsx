import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { cvSignal, type CV } from "./shared.ts";

export default function CVGenerator() {
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const cvs = useSignal<Array<{ 
    id: number; 
    title: string; 
    job_title: string | null;
    company: string | null;
    created_at: Date; 
    updated_at: Date;
  }>>([]);

  // Load CVs and default CV on mount
  useEffect(() => {
    loadCVs();
    loadCV(1);
  }, []);

  const loadCVs = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch("/api/cv");
      if (!response.ok) {
        throw new Error(`Failed to load CVs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      cvs.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  const loadCV = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(`/api/cv?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to load CV: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      cvSignal.value = { ...data, id };
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-sm p-4">
      <div class="space-y-4">
        {/* CV Selection List */}
        <div class="space-y-2">
          {cvs.value.map((cv) => (
            <button
              key={cv.id}
              onClick={() => loadCV(cv.id)}
              class="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div class="font-medium text-gray-900">{cv.title}</div>
              {(cv.job_title || cv.company) && (
                <div class="text-xs text-gray-500 mt-0.5">
                  {cv.job_title}
                  {cv.job_title && cv.company && " at "}
                  {cv.company}
                </div>
              )}
            </button>
          ))}
        </div>

        {error.value && (
          <div class="text-red-600 text-sm px-3">
            {error.value}
          </div>
        )}
      </div>
    </div>
  );
} 