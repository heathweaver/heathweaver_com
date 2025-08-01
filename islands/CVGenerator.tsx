import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { cvSignal, type CV } from "./shared.ts";

export default function CVGenerator() {
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const selectedCvId = useSignal<number | null>(null);
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
      selectedCvId.value = id;

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
    <div class="space-y-4">
      {/* CV Selection Dropdown */}
      <div class="relative">
        <select
          onChange={(e) => loadCV(Number(e.currentTarget.value))}
          value={selectedCvId.value?.toString() || ""}
          class={`block w-full px-3 py-2 text-sm bg-white border rounded-md shadow-sm appearance-none transition-colors
            ${isLoading.value ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
            ${error.value ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'}
            focus:outline-none focus:ring-1`}
          disabled={isLoading.value}
        >
          <option value="" disabled>Select a CV</option>
          {cvs.value.map((cv) => (
            <option key={cv.id} value={cv.id}>
              {cv.title}
              {(cv.job_title || cv.company) && ` - ${[cv.job_title, cv.company].filter(Boolean).join(" at ")}`}
            </option>
          ))}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          {isLoading.value ? (
            <svg class="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {error.value && (
        <div class="text-red-600 text-sm px-3 flex items-center">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error.value}</span>
        </div>
      )}
    </div>
  );
} 