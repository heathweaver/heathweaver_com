import { parseArgs } from "@std/cli/parse-args";
import { PDFGenerator } from "../backend/services/pdf/pdf-generator.ts";
import { processJobUrl } from "../backend/services/job/url-processor.ts";
// import { processJobContent } from "../backend/services/job/processor.ts";
import { CVGenerator } from "../backend/services/cv/cv-generator.ts";
import { CVLoader } from "../backend/services/cv/cv-loader.ts";
import { XAIService } from "../backend/services/ai/xai.ts";
import { DeepSeekService } from "../backend/services/ai/deepseek.ts";
import { DatabaseService } from "../backend/db/database.ts";
import { config } from "../config.ts";
import { AIService } from "../backend/types/ai-service.types.ts";

/**
 * CLI Arguments:
 * --job-listing: URL of the job posting to analyze and generate CV for
 * --model: AI model to use for generation (default: "xai")
 *          Options: "xai" or deepseek models like "deepseek-coder"
 * --json: Path to existing CV JSON file to generate PDF from
 *         (mutually exclusive with --job-listing)
 */
const args = parseArgs(Deno.args, {
  string: ["job-listing", "model", "json"],
  default: { model: "xai" },
});

// Validate required arguments - either job listing URL or JSON file is required
if (!args["job-listing"] && !args["json"]) {
  console.error("Please provide either --job-listing or --json");
  Deno.exit(1);
}

try {
  // Initialize database
  const db = new DatabaseService();
  await db.connect();

  // Initialize AI service based on model argument
  const aiService = args["model"] === "xai" 
    ? new XAIService(config.xai_api_key)
    : new DeepSeekService(config.deepseek_api_key, args["model"]);

  console.log(`Using AI model: ${args["model"]}`);

  // Get CV data either from JSON or by generating it
  const { cv, jobTitle } = args["json"] 
    ? { 
        cv: await new CVLoader(args["json"]).loadCV(), 
        jobTitle: args["json"].match(/HeathWeaver_(.+?)_\d{5}/)?.[1] || "FromJson"
      }
    : await generateCV(args["job-listing"]!, db, aiService);

  // Generate PDF
  console.log("\nGenerating PDF...");
  const pdfGenerator = new PDFGenerator();
  const pdfBytes = await pdfGenerator.generateCV(cv);

  // Generate unique ID for file naming (2 bytes converted to 4-digit number)
  const id = Array.from(crypto.getRandomValues(new Uint8Array(2)))
    .map(b => b % 100)
    .join('')
    .padStart(5, '0');

  // Format job title for filename (PascalCase)
  const formattedTitle = jobTitle
    .split(/[\s-]+/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const filename = `backend/artifacts/HeathWeaver_${formattedTitle}_${id}.pdf`;
  const jsonFilename = `backend/artifacts/HeathWeaver_${formattedTitle}_${id}.json`;

  await Deno.writeFile(filename, pdfBytes);
  await Deno.writeTextFile(jsonFilename, JSON.stringify(cv, null, 2));
  
  console.log(`Files generated successfully:
- PDF: ${filename}
- JSON: ${jsonFilename}`);

  // Clean up
  await db.disconnect();

} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : error);
  Deno.exit(1);
}

/**
 * Generates a customized CV based on the job posting URL
 * 
 * @param jobUrl - URL of the job posting to analyze
 * @param db - Database service instance for persistence
 * @param aiService - AI service instance for content generation
 * @returns Object containing generated CV and job title
 */
async function generateCV(jobUrl: string, db: DatabaseService, aiService: AIService) {
  console.log("Fetching job posting...");
  const jobResult = await processJobUrl(jobUrl, aiService, db);
  console.log("Job data:", jobResult);

  if (!jobResult.title || !jobResult.company) {
    throw new Error("Failed to extract required job information (title or company)");
  }

  console.log("\nGenerating CV...");
  const cvGenerator = new CVGenerator(aiService, db);
  const cv = await cvGenerator.generateCV({
    jobId: jobResult.id,
    jobTitle: jobResult.title,
    company: jobResult.company,
    jobDescription: jobResult.description || "",
    requirements: Array.isArray(jobResult.requirements) ? jobResult.requirements.join("\n") : "",
    responsibilities: Array.isArray(jobResult.responsibilities) ? jobResult.responsibilities.join("\n") : ""
  });

  return { cv, jobTitle: jobResult.title };
} 