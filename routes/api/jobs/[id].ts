import { define } from "../../../utils.ts";
import { sql } from "../../../lib/db/postgres-base.ts";
import { JobStatus } from "../../../backend/types/job-tracking.ts";

export const handler = define.handlers({
  // Get a single job
  async GET(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, { status: 401 });
    }

    const id = ctx.params.id;

    try {
      const result = await sql`
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
        WHERE id = ${id} AND user_id = ${user.$id}
      `;

      if (!result.length) {
        return new Response(
          JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify(result[0]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      console.error("Error fetching job:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal Server Error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  // Update a job
  async PUT(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, { status: 401 });
    }

    const id = ctx.params.id;

    try {
      const body = await ctx.req.json();
      const { companyName, jobTitle, status, jobUrl, jobDescription, notes } = body;

      // Validate required fields
      if (!companyName || !jobTitle || !status) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: companyName, jobTitle, status",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate status
      const validStatuses: JobStatus[] = [
        "saved",
        "applied",
        "interviewing",
        "offer",
        "closed",
      ];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: "Invalid status value" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await sql`
        UPDATE job_tracking
        SET
          company_name = ${companyName},
          job_title = ${jobTitle},
          status = ${status},
          job_url = ${jobUrl || null},
          job_description = ${jobDescription || null},
          notes = ${notes || null}
        WHERE id = ${id} AND user_id = ${user.$id}
        RETURNING 
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
      `;

      if (!result.length) {
        return new Response(
          JSON.stringify({ error: "Job not found or unauthorized" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify(result[0]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      console.error("Error updating job:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal Server Error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
