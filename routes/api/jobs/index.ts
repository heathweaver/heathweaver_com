import { createJob } from "../../../lib/db/job-tracking-db.ts";
import { JobStatus } from "../../../backend/types/job-tracking.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, { status: 401 });
    }

    try {
      const body = await ctx.req.json();
      const { companyName, jobTitle, status, jobUrl, jobDescription, notes } =
        body;

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

      const job = await createJob({
        userId: user.$id,
        companyName,
        jobTitle,
        status,
        jobUrl,
        jobDescription,
        notes,
      });

      return new Response(JSON.stringify(job), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      console.error("Error creating job:", error);

      // Handle duplicate constraint violation
      if (
        error instanceof Error &&
        error.message.includes("unique_job_application")
      ) {
        return new Response(
          JSON.stringify({
            error: "You have already saved this job (same company and title)",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Internal Server Error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
