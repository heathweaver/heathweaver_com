import { parseArgs } from "@std/cli/parse-args";
import { PDFGenerator } from "../backend/services/pdf/pdf-generator.ts";
import { processJobUrl } from "../backend/services/job/url-processor.ts";
// import { processJobContent } from "../backend/services/job/processor.ts";
import { CVGenerator } from "../backend/services/cv/cv-generator.ts";
import { CVLoader } from "../backend/services/cv/cv-loader.ts";
import { XAIService } from "../backend/services/ai/xai.ts";
import { DatabaseService } from "../backend/db/database.ts";
import { config } from "../config.ts";

const args = parseArgs(Deno.args, {
  string: ["job-listing", "model", "json"],
  default: { model: "xai" },
});

if (!args["job-listing"] && !args["json"]) {
  console.error("Please provide either --job-listing or --json");
  Deno.exit(1);
}

try {
  // Initialize database
  const db = new DatabaseService();
  await db.connect();

  // Get CV data either from JSON or by generating it
  const cv = args["json"] 
    ? await new CVLoader(args["json"]).loadCV()
    : await generateCV(args["job-listing"]!, db);

  // Generate PDF
  console.log("\nGenerating PDF...");
  const pdfGenerator = new PDFGenerator();
  const pdfBytes = await pdfGenerator.generateCV(cv);

  // Save files with consistent naming
  const id = Array.from(crypto.getRandomValues(new Uint8Array(2)))
    .map(b => b % 100)
    .join('')
    .padStart(5, '0');

  const jobTitle = (cv.basicInfo.title || "RemoteExecutive")
    .split(/[\s-]+/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const filename = `backend/artifacts/HeathWeaver_${jobTitle}_${id}.pdf`;
  const jsonFilename = `backend/artifacts/HeathWeaver_${jobTitle}_${id}.json`;

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

async function generateCV(jobUrl: string, db: DatabaseService) {
  console.log("Fetching job posting...");
  const aiService = new XAIService(config.xai_api_key);
  const jobResult = await processJobUrl(jobUrl, aiService, db);
  if (jobResult.error) {
    throw new Error(`Failed to fetch job posting: ${jobResult.error}`);
  }

  console.log("\nProcessing job content...");
  if (jobResult.error) {
    throw new Error(`Failed to process job content: ${jobResult.error}`);
  }

  console.log("\nGenerating CV...");
  const cvGenerator = new CVGenerator(aiService, db);
  return cvGenerator.generateCV({
    jobId: jobResult.id,
    jobTitle: jobResult.title || "",
    company: jobResult.company || "",
    jobDescription: jobResult.description || "",
    requirements: jobResult.requirements?.join("\n") || "",
    responsibilities: jobResult.responsibilities?.join("\n") || ""
  });
} 