import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createJob } from "../../../../lib/db/job-tracking-db.ts";
import { JobStatus } from "../../../../backend/types/job-tracking.ts";
import { sql } from "../../../../lib/db/postgres-base.ts";

const TEST_USER_ID = "1347734468"; // Actual user ID from database

// Use a single test with steps to ensure proper cleanup
Deno.test("createJob database operations", async (t) => {
  try {
    await t.step("creates job with required fields", async () => {
      const timestamp = Date.now();
      const params = {
        userId: TEST_USER_ID,
        companyName: `Test Company ${timestamp}`,
        jobTitle: "Senior Developer",
        status: "saved" as JobStatus,
      };

      const job = await createJob(params);

      try {
        assertExists(job);
        assertExists(job.id);
        assertEquals(job.companyName, `Test Company ${timestamp}`);
        assertEquals(job.jobTitle, "Senior Developer");
        assertEquals(job.status, "saved");
        assertEquals(job.userId, TEST_USER_ID);
        assertExists(job.createdDate);
      } finally {
        // Clean up
        await sql`DELETE FROM job_tracking WHERE id = ${job.id}`;
      }
    });

    await t.step("creates job with optional fields", async () => {
      const timestamp = Date.now();
      const params = {
        userId: TEST_USER_ID,
        companyName: `Another Company ${timestamp}`,
        jobTitle: "Product Manager",
        status: "applied" as JobStatus,
        jobUrl: "https://example.com/job",
        jobDescription: "This is a test job description",
        notes: "Interesting opportunity",
      };

      const job = await createJob(params);

      try {
        assertExists(job);
        assertEquals(job.jobUrl, "https://example.com/job");
        assertEquals(job.jobDescription, "This is a test job description");
        assertEquals(job.notes, "Interesting opportunity");
      } finally {
        // Clean up
        await sql`DELETE FROM job_tracking WHERE id = ${job.id}`;
      }
    });

    await t.step("handles different job statuses", async () => {
      const statuses: JobStatus[] = [
        "saved",
        "applied",
        "interviewing",
        "offer",
        "closed",
      ];

      const createdIds: string[] = [];

      try {
        for (const status of statuses) {
          const timestamp = Date.now();
          const params = {
            userId: TEST_USER_ID,
            companyName: `Status Test Company ${timestamp}`,
            jobTitle: `${status} Position`,
            status,
          };

          const job = await createJob(params);
          createdIds.push(job.id);
          assertEquals(job.status, status);

          // Small delay to ensure unique timestamps
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } finally {
        // Clean up all created jobs
        if (createdIds.length > 0) {
          await sql`DELETE FROM job_tracking WHERE id = ANY(${createdIds})`;
        }
      }
    });
  } finally {
    // Close the connection pool after all tests
    await sql.end();
  }
});
