import { Signal, useSignal } from "@preact/signals";
import { JobStatus } from "../../backend/types/job-tracking.ts";

interface JobSearchProps {
  searchTerm: Signal<string>;
  activeFilter: Signal<JobStatus | null>;
}

export default function JobSearch(
  { searchTerm, activeFilter }: JobSearchProps,
) {
  const statuses: JobStatus[] = ["applied", "interviewing", "offer"];

  return (
    <div class="space-y-4">
      <input
        type="search"
        placeholder="Search Jobs"
        value={searchTerm.value}
        onInput={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />

      <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() =>
              activeFilter.value = activeFilter.value === status
                ? null
                : status}
            class={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors
              ${
              activeFilter.value === status
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-900 shadow hover:bg-gray-50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
