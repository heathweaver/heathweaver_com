import { processJobUrl } from "../backend/services/job/url-processor.ts";
import { XAIService } from "../backend/services/ai/xai.ts";

const TEST_URLS = [
  // Add URLs that we know have worked in the past
  "https://www.simplyhired.com/job/K35yF5NR6bTwZ9Y44AOco7zX0pEq1bhayoxrBI13ed50YPBypYIBTQ",
  "https://adaptiveteams.teamtailor.com/jobs/5560524-marketing-manager",
  "https://apply.workable.com/endear/j/FF79223884/"
  // Add more URLs as we find them
];

async function testJobParsing() {
  const ai = new XAIService(Deno.env.get("XAI_API_KEY"));
  
  console.log("Starting job parser tests...\n");
  
  for (const url of TEST_URLS) {
    console.log(`Testing URL: ${url}`);
    try {
      const result = await processJobUrl(url, ai);
      console.log("Result:", {
        success: !result.error,
        error: result.error,
        hasTitle: !!result.title,
        hasCompany: !!result.company,
        hasDescription: !!result.description,
        contentLength: result.description?.length || 0
      });
    } catch (err) {
      console.error(`Failed to process ${url}:`, err);
    }
    console.log("\n---\n");
  }
}

if (import.meta.main) {
  await testJobParsing();
} 