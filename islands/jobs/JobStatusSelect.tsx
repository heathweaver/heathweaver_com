import { JobTracking, JobStatus } from "../../backend/types/job-tracking.ts";

interface JobStatusSelectProps {
  job: JobTracking;
}

export default function JobStatusSelect({ job }: JobStatusSelectProps) {
  const statuses: JobStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'closed'];

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  return (
    <select
      value={job.status}
      onChange={(e) => {
        const select = e.target as HTMLSelectElement;
        if (select && statuses.includes(select.value as JobStatus)) {
          handleStatusChange(select.value as JobStatus);
        }
      }}
      class="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md"
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
} 