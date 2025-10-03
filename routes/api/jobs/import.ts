import { processJobUrl } from "../../../backend/services/job/url-processor.ts";
import { XAIService } from "../../../backend/services/ai/xai.ts";
import { define } from "../../../utils.ts";

// Initialize AI service
const aiService = new XAIService(Deno.env.get("XAI_API_KEY"));

export const handler = define.handlers({
  async POST(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, { status: 401 });
    }

    try {
      const body = await ctx.req.json();
      const { url } = body;

      // Validate URL
      if (!url) {
        return new Response(
          JSON.stringify({ error: "URL is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid URL format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Process the job URL
      const jobContent = await processJobUrl(url, aiService);

      // Check for errors
      if (jobContent.error) {
        return new Response(
          JSON.stringify({ error: jobContent.error }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }

      // Return the extracted job data
      return new Response(JSON.stringify(jobContent), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      console.error("Error importing job:", error);

      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to import job",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
