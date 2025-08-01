import { processJobUrl } from "../backend/utils/process-job-url.ts";
import { structureJobContent, validateJobContent, prepareCVPrompt } from "../backend/utils/job-content-processor.ts";
import { AnthropicService } from "../backend/services/ai/anthropic.ts";
import { XAIService } from "../backend/services/ai/xai.ts";

// Get API keys from environment
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
const xaiKey = Deno.env.get("XAI_API_KEY");

if (!anthropicKey && !xaiKey) {
  console.error("Either ANTHROPIC_API_KEY or XAI_API_KEY environment variable is required");
  Deno.exit(1);
}

// Initialize services
const services = {
  anthropic: anthropicKey ? new AnthropicService(anthropicKey) : null,
  xai: xaiKey ? new XAIService(xaiKey) : null,
};

// Test URL
const url = "https://www.linkedin.com/jobs/view/4093796649/";

async function testService(name: string, service: AnthropicService | XAIService) {
  console.log(`\nTesting job content processor with ${name}...\n`);

  try {
    // First get the raw content
    console.log("Fetching job posting...");
    const result = await processJobUrl(url);
    
    if (!result.success || !result.content) {
      console.error("Failed to fetch job posting:", result.error);
      return;
    }

    // Create the LLM prompt for structuring
    console.log("\nCreating structure prompt...");
    const structurePrompt = structureJobContent(result.content);
    
    // Send to service for structuring
    console.log(`\nSending to ${name} for analysis...`);
    const structuredResponse = await service.processJobPosting(structurePrompt);
    
    if (structuredResponse.error || !structuredResponse.content.length) {
      console.error(`${name} processing failed:`, structuredResponse.error);
      return;
    }

    // Parse and validate the structured content
    console.log("\nValidating structured content...");
    let structuredContent;
    try {
      structuredContent = JSON.parse(structuredResponse.content[0]);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      console.log("Raw response:", structuredResponse.content[0]);
      return;
    }

    const validatedContent = validateJobContent(structuredContent);
    if (validatedContent.error) {
      console.error("Content validation failed:", validatedContent.error);
      return;
    }

    // Create the CV customization prompt
    console.log("\nCreating CV customization prompt...");
    const cvPrompt = prepareCVPrompt(validatedContent);
    
    // Send to service for CV suggestions
    console.log(`\nSending to ${name} for CV suggestions...`);
    const cvResponse = await service.generateCV(cvPrompt);
    
    if (cvResponse.error || !cvResponse.content.length) {
      console.error("CV generation failed:", cvResponse.error);
      return;
    }

    // Output results
    console.log(`\n${name} Structured Job Content:`);
    console.log("=".repeat(80));
    console.log(JSON.stringify(validatedContent, null, 2));
    
    console.log(`\n${name} CV Customization Suggestions:`);
    console.log("=".repeat(80));
    console.log(cvResponse.content[0]);

  } catch (error) {
    console.error("Error during processing:", error);
  }
}

// Run tests for available services
if (services.anthropic) {
  await testService("Anthropic", services.anthropic);
}

if (services.xai) {
  await testService("xAI", services.xai);
} 