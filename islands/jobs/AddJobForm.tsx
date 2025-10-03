import { useSignal } from "@preact/signals";
import { JobStatus } from "../../backend/types/job-tracking.ts";

interface ImportedJobData {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  error?: string;
}

interface AddJobFormProps {
  jobId?: string;
}

export default function AddJobForm({ jobId }: AddJobFormProps) {
  const isEditing = !!jobId;
  const jobUrl = useSignal("");
  const companyName = useSignal("");
  const jobTitle = useSignal("");
  const status = useSignal<JobStatus>("saved");
  const jobDescription = useSignal("");
  const notes = useSignal("");
  const isImporting = useSignal(false);
  const isSubmitting = useSignal(false);
  const importError = useSignal("");
  const submitError = useSignal("");
  const submitSuccess = useSignal(false);
  const showManualForm = useSignal(isEditing); // Show form immediately if editing
  const isLoading = useSignal(false);

  // Load existing job data if editing
  if (isEditing && !isLoading.value && !companyName.value) {
    isLoading.value = true;
    fetch(`/api/jobs/${jobId}`)
      .then(res => res.json())
      .then(job => {
        companyName.value = job.companyName || "";
        jobTitle.value = job.jobTitle || "";
        status.value = job.status || "saved";
        jobUrl.value = job.jobUrl || "";
        jobDescription.value = job.jobDescription || "";
        notes.value = job.notes || "";
        isLoading.value = false;
      })
      .catch(err => {
        console.error("Error loading job:", err);
        submitError.value = "Failed to load job data";
        isLoading.value = false;
      });
  }

  const handleImport = async () => {
    if (!jobUrl.value.trim()) {
      importError.value = "Please enter a job URL";
      return;
    }

    isImporting.value = true;
    importError.value = "";

    try {
      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.value }),
      });

      const data: ImportedJobData = await response.json();

      if (!response.ok) {
        // Error is now always a string from the API
        const errorMsg = typeof data.error === 'string' ? data.error : "Failed to import job";
        console.log("Setting error message:", errorMsg);
        importError.value = errorMsg;
        console.log("Error value after setting:", importError.value);
        // Keep the URL so user can try again or edit it
        return;
      }

      // Check if we got valid data
      if (!data.company && !data.title && !data.description) {
        importError.value = "Could not extract job details from this URL. Please enter details manually.";
        return;
      }

      // Populate form fields with imported data
      if (data.company) companyName.value = data.company;
      if (data.title) jobTitle.value = data.title;
      if (data.description) jobDescription.value = data.description;

      // Show manual form after successful import
      showManualForm.value = true;

      // Clear any previous errors
      importError.value = "";
    } catch (error) {
      console.error("Import error:", error);
      importError.value = "Failed to import job. Please try again.";
    } finally {
      isImporting.value = false;
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!companyName.value.trim() || !jobTitle.value.trim()) {
      submitError.value = "Company name and job title are required";
      return;
    }

    isSubmitting.value = true;
    submitError.value = "";
    submitSuccess.value = false;

    try {
      const url = isEditing ? `/api/jobs/${jobId}` : "/api/jobs";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.value,
          jobTitle: jobTitle.value,
          status: status.value,
          jobUrl: jobUrl.value || undefined,
          jobDescription: jobDescription.value || undefined,
          notes: notes.value || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        submitError.value = data.error || `Failed to ${isEditing ? "update" : "create"} job`;
        return;
      }

      // Success - redirect to jobs list
      submitSuccess.value = true;
      setTimeout(() => {
        globalThis.location.href = "/jobs";
      }, 1000);
    } catch (error) {
      console.error("Submit error:", error);
      submitError.value = "Failed to create job. Please try again.";
    } finally {
      isSubmitting.value = false;
    }
  };

  return (
    <div class="bg-white shadow rounded-lg p-6">
      {/* URL Import Section */}
      <div class="mb-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Import from URL (Optional)
        </h2>
        <div class="flex gap-4">
          <div class="flex-1">
            <label htmlFor="jobUrl" class="sr-only">
              Job URL
            </label>
            <input
              type="url"
              id="jobUrl"
              value={jobUrl.value}
              onInput={(e) => jobUrl.value = (e.target as HTMLInputElement).value}
              placeholder="https://example.com/job-posting"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2"
              disabled={isImporting.value || isSubmitting.value}
            />
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting.value || !jobUrl.value.trim()}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting.value ? "Importing..." : "Import"}
          </button>
        </div>
        {importError.value && (
          <p class="mt-2 text-sm text-red-600">{importError.value}</p>
        )}
        {isImporting.value && (
          <p class="mt-2 text-sm text-gray-500">
            Extracting job details... This may take a few seconds.
          </p>
        )}
        {!showManualForm.value && !isImporting.value && (
          <button
            type="button"
            onClick={() => showManualForm.value = true}
            class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Add Manually
          </button>
        )}
      </div>

      {/* Manual Entry Form */}
      {showManualForm.value && (
      <form onSubmit={handleSubmit}>
        <div class="space-y-6">
          <h2 class="text-lg font-medium text-gray-900">Job Details</h2>

          {/* Company Name */}
          <div>
            <label
              htmlFor="companyName"
              class="block text-sm font-medium text-gray-700"
            >
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName.value}
              onInput={(e) =>
                companyName.value = (e.target as HTMLInputElement).value}
              required
              disabled={isSubmitting.value}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Job Title */}
          <div>
            <label
              htmlFor="jobTitle"
              class="block text-sm font-medium text-gray-700"
            >
              Job Title *
            </label>
            <input
              type="text"
              id="jobTitle"
              value={jobTitle.value}
              onInput={(e) =>
                jobTitle.value = (e.target as HTMLInputElement).value}
              required
              disabled={isSubmitting.value}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              class="block text-sm font-medium text-gray-700"
            >
              Status *
            </label>
            <select
              id="status"
              value={status.value}
              onChange={(e) =>
                status.value = (e.target as HTMLSelectElement).value as JobStatus}
              disabled={isSubmitting.value}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Job Description */}
          <div>
            <div class="flex justify-between items-center">
              <label
                htmlFor="jobDescription"
                class="block text-sm font-medium text-gray-700"
              >
                Job Description
              </label>
              <span class="text-sm text-gray-500">
                {jobDescription.value.length} characters
              </span>
            </div>
            <textarea
              id="jobDescription"
              value={jobDescription.value}
              onInput={(e) =>
                jobDescription.value = (e.target as HTMLTextAreaElement).value}
              rows={6}
              disabled={isSubmitting.value}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
              style="white-space: pre-wrap;"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              class="block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={notes.value}
              onInput={(e) =>
                notes.value = (e.target as HTMLTextAreaElement).value}
              rows={3}
              disabled={isSubmitting.value}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {submitError.value && (
            <div class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-800">{submitError.value}</p>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess.value && (
            <div class="rounded-md bg-green-50 p-4">
              <p class="text-sm text-green-800">
                Job {isEditing ? "updated" : "created"} successfully! Redirecting...
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div class="flex justify-end gap-4">
            <a
              href="/jobs"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting.value}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting.value 
                ? (isEditing ? "Updating..." : "Creating...") 
                : (isEditing ? "Update Job" : "Create Job")
              }
            </button>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
