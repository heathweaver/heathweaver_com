import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { withTransaction } from "./postgres-base.ts";
import { JobStatus, JobTracking } from "../../backend/types/job-tracking.ts";

interface UpdateJobStatusParams {
  id: string;
  userId: string;
  status: JobStatus;
}

export async function getJobs(): Promise<JobTracking[]> {
  return await withTransaction(async (client: Client) => {
    const result = await client.queryObject<JobTracking>(
      `SELECT 
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
      ORDER BY created_date DESC`
    );
    
    return result.rows;
  });
}

export async function updateJobStatus({ id, userId, status }: UpdateJobStatusParams) {
  return await withTransaction(async (client: Client) => {
    // First verify this job belongs to the user
    const result = await client.queryObject<{ user_id: string }>(
      `SELECT user_id FROM job_tracking WHERE id = $1`,
      [id]
    );

    if (!result.rows.length || result.rows[0].user_id !== userId) {
      throw new Error('Unauthorized: Job does not belong to user');
    }

    // Update the status
    const updateResult = await client.queryObject(
      `UPDATE job_tracking 
       SET status = $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [status, id, userId]
    );
    
    if (!updateResult.rows.length) {
      throw new Error('Failed to update job status');
    }

    return updateResult.rows[0];
  });
} 