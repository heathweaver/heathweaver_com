import { Head } from "fresh/runtime";
import { JobTracking } from "../backend/types/job-tracking.ts";
import JobsPage from "../components/jobs/JobsPage.tsx";
import { getJobs } from "../lib/db/job-tracking-db.ts";
import { define } from "../utils.ts";

interface Data {
  jobs: JobTracking[];
}

export const handler = define.handlers({
  async GET(_ctx) {
    try {
      const jobs = await getJobs();
      return { data: { jobs } };
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return { data: { jobs: [] } };
    }
  },
});

export default define.page<typeof handler>(function JobsRoute(props) {
  const data = props.data;
  return (
    <>
      <Head>
        <title>Job Tracker</title>
      </Head>
      <JobsPage jobs={data.jobs} />
    </>
  );
});
