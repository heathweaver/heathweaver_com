import { processJobUrl } from "../backend/utils/process-job-url.ts";
import {
  prepareCVPrompt,
  structureJobContent,
  validateJobContent,
} from "../backend/utils/job-content-processor.ts";
import { XAIService } from "../backend/services/ai/xai.ts";

// Get API key from environment
const apiKey = Deno.env.get("XAI_API_KEY");
if (!apiKey) {
  console.error("XAI_API_KEY environment variable is required");
  Deno.exit(1);
}

// Initialize xAI service
const xai = new XAIService(apiKey);

// Test URL
const url = "https://www.linkedin.com/jobs/view/4093796649/";

console.log("Testing job content processor with xAI...\n");

try {
  // First get the raw content
  console.log("Fetching job posting...");
  const result = await processJobUrl(url);

  if (!result.success || !result.content) {
    console.error("Failed to fetch job posting:", result.error);
    Deno.exit(1);
  }

  // Create the LLM prompt for structuring
  console.log("\nCreating structure prompt...");
  const structurePrompt = structureJobContent(result.content);

  // Send to xAI for structuring
  console.log("\nSending to xAI for analysis...");
  const structuredResponse = await xai.processJobPosting(structurePrompt);

  if (structuredResponse.error || !structuredResponse.content.length) {
    console.error("xAI processing failed:", structuredResponse.error);
    Deno.exit(1);
  }

  // Parse and validate the structured content
  console.log("\nValidating structured content...");
  let structuredContent;
  try {
    structuredContent = JSON.parse(structuredResponse.content[0]);
  } catch (e) {
    console.error("Failed to parse xAI response as JSON:", e);
    console.log("Raw response:", structuredResponse.content[0]);
    Deno.exit(1);
  }

  const validatedContent = validateJobContent(structuredContent);
  if (validatedContent.error) {
    console.error("Content validation failed:", validatedContent.error);
    Deno.exit(1);
  }

  // Create the CV customization prompt
  console.log("\nCreating CV customization prompt...");
  const cvPrompt = prepareCVPrompt(validatedContent);

  // Send to xAI for CV suggestions
  console.log("\nSending to xAI for CV suggestions...");
  const cvResponse = await xai.generateCV(cvPrompt);

  if (cvResponse.error || !cvResponse.content.length) {
    console.error("CV generation failed:", cvResponse.error);
    Deno.exit(1);
  }

  // Output results
  console.log("\nStructured Job Content:");
  console.log("=".repeat(80));
  console.log(JSON.stringify(validatedContent, null, 2));

  console.log("\nCV Customization Suggestions:");
  console.log("=".repeat(80));
  console.log(cvResponse.content[0]);
} catch (error) {
  console.error("Error during processing:", error);
  Deno.exit(1);
}
