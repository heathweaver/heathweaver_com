import { JobStatus, JobTracking } from "../../backend/types/job-tracking.ts";
import JobStatusSelect from "../../islands/jobs/JobStatusSelect.tsx";
import JobSearch from "../../islands/jobs/JobSearch.tsx";
import Navigation from "../Navigation.tsx";
import { useSignal } from "@preact/signals";

interface JobsPageProps {
  jobs: JobTracking[];
}

export default function JobsPage({ jobs }: JobsPageProps) {
  const searchTerm = useSignal("");
  const activeFilter = useSignal<JobStatus | null>(null);

  // Filter jobs based on search term and active filter
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = searchTerm.value === "" ||
      job.companyName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(searchTerm.value.toLowerCase());

    const matchesFilter = !activeFilter.value ||
      job.status === activeFilter.value;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Navigation />
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Track Jobs</h1>
            <a
              href="/jobs/add"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              + Add Job
            </a>
          </div>

          <JobSearch
            searchTerm={searchTerm}
            activeFilter={activeFilter}
          />
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <colgroup>
              <col class="w-[22%]" /> {/* Company Name - 22% */}
              <col class="w-[22%]" /> {/* Job Title - 22% */}
              <col class="w-[15%]" /> {/* Created Date - 15% */}
              <col class="w-[21%]" /> {/* Status - 21% */}
              <col class="w-1/5" /> {/* CV Status - 20% */}
            </colgroup>
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
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  Created Date
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  CV Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900 break-words">
                      {job.companyName}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 break-words">
                      {job.jobTitle}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                      {new Date(job.createdDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <JobStatusSelect job={job} />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                      {job.cvId
                        ? (
                          <>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              CV Generated
                            </span>
                            <a
                              href={`/cv/${job.cvId}`}
                              class="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                            >
                              View CV
                            </a>
                          </>
                        )
                        : (
                          <button
                            type="button"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-emerald-100 hover:text-emerald-800"
                          >
                            Generate CV
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
