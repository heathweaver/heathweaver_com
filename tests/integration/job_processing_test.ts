import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { fetchJobPosting } from "../../backend/services/job/fetcher.ts";
import { extractJobContent } from "../../backend/services/job/parser.ts";
import { processJobContent } from "../../backend/services/job/processor.ts";
import { AIResponse } from "../../backend/types/ai-service.types.ts";
import { DatabaseService } from "../../backend/services/database.ts";

// Database config for testing
const dbConfig = {
  host: "ssc.one",
  database: "cv_rag",
  user: "cv_heathweaver",
  password: "cv_heathweaver",
  port: 5433,
};

Deno.test({
  name: "Job Processing Integration - Greenhouse URL to Database",
  async fn() {
    const url = "https://job-boards.greenhouse.io/earnest/jobs/6271491";
    let jobId: string | undefined;

    // 1. Fetch the content
    const fetchResult = await fetchJobPosting(url);
    assertEquals(fetchResult.success, true, "Failed to fetch job content");
    assertEquals(
      typeof fetchResult.content,
      "string",
      "No content returned from fetch",
    );

    // 2. Parse the HTML
    const parseResult = await extractJobContent(fetchResult.content!);
    assertEquals(parseResult.success, true, "Failed to parse job content");
    assertEquals(
      typeof parseResult.content,
      "string",
      "No content returned from parse",
    );

    // 3. Process with AI and store
    const db = new DatabaseService(dbConfig);
    try {
      const result = await processJobContent(parseResult.content!, {
        async processJobPosting(prompt: string): Promise<AIResponse> {
          console.log("AI Prompt:", prompt); // Log the prompt for inspection
          return {
            content: [`{
              "title": "Senior Software Engineer - Backend",
              "company": "Earnest",
              "location": "Remote-first",
              "description": "Looking for a Senior Software Engineer to join our Backend Engineering team.",
              "requirements": ["5+ years experience"],
              "responsibilities": ["Build backend services"]
            }`],
          };
        },
      }, db);

      // 4. Verify the result
      assertEquals(result.error, undefined, "Processing failed");
      assertEquals(
        result.title?.includes("Engineer"),
        true,
        "Title should contain Engineer",
      );
      assertEquals(
        result.company?.includes("Earnest"),
        true,
        "Company should be Earnest",
      );
      assertEquals(typeof result.id, "string", "Should have generated an ID");
      assertEquals(result.id?.length, 20, "ID should be 20 chars");

      if (!result.id) {
        throw new Error("No ID generated");
      }
      jobId = result.id;

      // 5. Verify it's in the database
      const stored = await db.getJobContent(jobId);
      assertEquals(stored?.id, jobId, "ID should match");
      assertEquals(stored?.title, result.title, "Title should match");
      assertEquals(stored?.company, result.company, "Company should match");
    } finally {
      // 6. Clean up
      if (jobId) {
        await db.deleteJobContent(jobId);
      }
      await db.disconnect();
    }
  },
});
