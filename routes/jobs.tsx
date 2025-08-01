import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { JobTracking } from "../backend/types/job-tracking.ts";
import JobsPage from "../components/jobs/JobsPage.tsx";
import { getJobs } from "../lib/db/job-tracking-db.ts";

interface Data {
  jobs: JobTracking[];
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    try {
      const jobs = await getJobs();
      return ctx.render({ jobs });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return ctx.render({ jobs: [] });
    }
  },
};

export default function JobsRoute({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>Job Tracker</title>
      </Head>
      <JobsPage jobs={data.jobs} />
    </>
  );
} 