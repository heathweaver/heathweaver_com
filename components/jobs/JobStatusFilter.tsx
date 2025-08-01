import { JobStatus } from "../../backend/types/job-tracking.ts";

export default function JobStatusFilter() {
  const statuses: JobStatus[] = ['applied', 'interviewing', 'offer'];
  
  return (
    <div class="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
      {statuses.map((status) => (
        <button
          key={status}
          class={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none
            bg-white shadow text-gray-900`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
    </div>
  );
} 