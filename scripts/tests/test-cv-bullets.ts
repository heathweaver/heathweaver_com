import { DeepSeekService } from "../../backend/services/ai/deepseek.ts";
import { CV_JOB_BULLETS } from "../../backend/prompt/index.ts";
import { config } from "../../config.ts";

// Initialize DeepSeek service
const service = new DeepSeekService(config.deepseek_api_key);

// Sample target job requirements - these would normally come from the job posting
const targetJobRequirements = [
  "Experience in B2B SaaS marketing and sales enablement",
  "Track record of implementing and managing CRM systems",
  "Ability to develop and deliver effective training programs",
  "Experience in creating and executing ABM strategies",
  "Leadership experience in marketing operations"
];

async function testBulletGeneration() {
  console.log("\nTesting CV bullet generation with DeepSeek...\n");

  try {
    // Read the CV data from JSON file
    const cvData = JSON.parse(await Deno.readTextFile("backend/artifacts/HeathWeaver_HeadOfOperations&ClientSuccess_04518.json"));
    
    // Get the job data from the JSON
    const jobData = cvData.experience[1]; // Using Trilogy Software position as example

    // Construct the prompt
    const bulletCount = 3; // Based on job duration
    const wordCount = 25; // Max words per bullet
    
    const systemInstructions = CV_JOB_BULLETS.system_instructions
      .replace('<CURRENT_CURSOR_POSITION>', '')
      .replace('{bulletCount}', String(bulletCount))
      .replace('{wordCount}', String(wordCount));
      
    const rules = CV_JOB_BULLETS.rules
      .replace('{bulletCount}', String(bulletCount))
      .replace('{wordCount}', String(wordCount));
      
    const responseFormat = CV_JOB_BULLETS.response_format
      .replace('{bulletCount}', String(bulletCount));

    const prompt = `${systemInstructions}

Target Role Requirements:
${targetJobRequirements.join('\n')}

Job History:
Company: ${jobData.company}
Title: ${jobData.title}
Duration: ${jobData.start_date} to ${jobData.end_date}

Responsibilities:
${jobData.responsibilities.join('\n')}

Achievements:
${jobData.achievements.join('\n')}

Narrative:
${jobData.narrative.join('\n')}

${rules}

${responseFormat}`;

    // Send to service for processing
    console.log("Sending to DeepSeek for bullet point generation...");
    const response = await service.processJobPosting(prompt);
    
    if (response.error || !response.content.length) {
      console.error("DeepSeek processing failed:", response.error);
      return;
    }

    // Parse and validate the response
    console.log("\nParsing response...");
    try {
      const result = JSON.parse(response.content[0]);
      console.log("\nDeepSeek Generated Bullet Points:");
      console.log("=".repeat(80));
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      console.log("Raw response:", response.content[0]);
    }

  } catch (error) {
    console.error("Error during processing:", error);
  }
}

// Run test
await testBulletGeneration(); 