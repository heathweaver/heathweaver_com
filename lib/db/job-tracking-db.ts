import { sql, withTransaction } from "./postgres-base.ts";
import { JobStatus, JobTracking } from "../../backend/types/job-tracking.ts";

interface UpdateJobStatusParams {
  id: string;
  userId: string;
  status: JobStatus;
}

export async function getJobs(): Promise<JobTracking[]> {
  const results = await sql<JobTracking[]>`
    SELECT 
      id,
      user_id as "userId",
      company_name as "companyName",
      job_title as "jobTitle",
      created_date as "createdDate",
      date_applied as "dateApplied",
      status,
      job_url as "jobUrl",
      job_description as "jobDescription",
      notes,
      cv_id as "cvId"
    FROM job_tracking
    ORDER BY created_date DESC
  `;
  return results as JobTracking[];
}

export async function updateJobStatus(
  { id, userId, status }: UpdateJobStatusParams,
) {
  return await withTransaction(async (sql) => {
    // First verify this job belongs to the user
    const result = await sql`
      SELECT user_id FROM job_tracking WHERE id = ${id}
    `;

    if (!result.length || result[0].user_id !== userId) {
      throw new Error("Unauthorized: Job does not belong to user");
    }

    // Update the status
    const updateResult = await sql`
      UPDATE job_tracking 
      SET status = ${status} 
      WHERE id = ${id} AND user_id = ${userId} 
      RETURNING *
    `;

    if (!updateResult.length) {
      throw new Error("Failed to update job status");
    }

    return updateResult[0];
  });
}
