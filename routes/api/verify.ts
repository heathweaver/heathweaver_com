import { define } from "../../utils.ts";
import { PromptMode } from "../../backend/prompt/index.ts";
import { withClient } from "@db/postgres-base.ts";
import { DBJobContent } from "../../backend/types/db.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const { code } = await ctx.req.json();

      // Check if it's a joke request
      if (code.toLowerCase().includes("joke")) {
        return new Response(
          JSON.stringify({
            isValid: true,
            mode: "jokes" as PromptMode,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      // Query the database
      const result = await withClient(async (sql) => {
        return await sql<DBJobContent[]>`
          SELECT * FROM job_content WHERE id = ${code}
        `;
      });

      if (!result.length) {
        return new Response(
          JSON.stringify({
            isValid: false,
            mode: "initial" as PromptMode,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      const jobData = result[0];

      const initialMessage =
        `Great! I can see you're interested in the ${jobData.title} position at ${jobData.company}. I'd be happy to discuss why Heath would be an excellent fit for this role. 

The position involves ${
          jobData.description || "various responsibilities"
        }, and I can provide specific insights about Heath's relevant experience and qualifications. What aspects of the role would you like to discuss first?`;

      return new Response(
        JSON.stringify({
          isValid: true,
          mode: "verified" as PromptMode,
          jobData: jobData,
          initialMessage,
          cvData: jobData.raw_content,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Verification error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          isValid: false,
          mode: "initial" as PromptMode,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
