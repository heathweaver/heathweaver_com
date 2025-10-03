import { useSignal } from "@preact/signals";
import { JobStatus, JobTracking } from "../backend/types/job-tracking.ts";
import Navigation from "../components/Navigation.tsx";

interface JobTrackerProps {
  initialJobs?: JobTracking[];
}

export default function JobTracker({ initialJobs = [] }: JobTrackerProps) {
  const jobs = useSignal<JobTracking[]>(initialJobs);
  const searchTerm = useSignal("");

  const statuses: JobStatus[] = [
    "saved",
    "applied",
    "interviewing",
    "offer",
    "closed",
  ];

  const filteredJobs = jobs.value.sort((a, b) =>
    new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );

  const handleStatusChange = (job: JobTracking, newStatus: JobStatus) => {
    const updatedJobs = jobs.value.map((j) => {
      if (j.id === job.id) {
        return { ...j, status: newStatus };
      }
      return j;
    });
    jobs.value = updatedJobs;
    // TODO: Add API call to update status
  };

  return (
    <div>
      <Navigation />
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Track Jobs</h1>
          <div class="flex items-center gap-4">
            <input
              type="search"
              placeholder="Search Jobs"
              value={searchTerm.value}
              onInput={(e) =>
                searchTerm.value = (e.target as HTMLInputElement).value}
              class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
              + Add Job
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="flex border-b border-gray-200">
            {statuses.map((status) => (
              <button
                key={status}
                class={`flex-1 py-4 px-4 text-center text-sm font-medium border-b-2 focus:outline-none
                  ${
                  status === "saved"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Company Name
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Job Title
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created Date
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  CV Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {job.companyName}
                    </div>
                    {job.location && (
                      <div class="text-sm text-gray-500">{job.location}</div>
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{job.jobTitle}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                      {new Date(job.createdDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      {job.cvId
                        ? (
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            CV Generated v{job.cvVersion}
                          </span>
                        )
                        : (
                          <button class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-emerald-100 hover:text-emerald-800">
                            Generate CV
                          </button>
                        )}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select
                      value={job.status}
                      onChange={(e) => {
                        const select = e.target as HTMLSelectElement;
                        if (
                          select && statuses.includes(select.value as JobStatus)
                        ) {
                          handleStatusChange(job, select.value as JobStatus);
                        }
                      }}
                      class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-emerald-600 hover:text-emerald-900 mr-4">
                      View CV
                    </button>
                    <button class="text-emerald-600 hover:text-emerald-900">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
