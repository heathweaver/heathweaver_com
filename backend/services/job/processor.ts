import { AIService } from "../../types/ai-service.types.ts";
import { JobContent } from "../../types/job.ts";
import { DatabaseService } from "../../db/database.ts";
import { 
  JOB_ANALYSIS_PROMPT, 
  JOB_DETAILS_PROMPT,
  JOB_CONTENT_EXTRACTION_PROMPT,
  JOB_CONTENT_PROCESSING_PROMPT
} from "../../prompt/index.ts";

const JOB_CONTENT_TEMPLATE = {
  title: "Job title",
  company: "Company name",
  location: "Location (including remote status)",
  salary: "Salary/compensation information",
  description: "Brief overview/summary of the role",
  requirements: "List of requirements/qualifications",
  responsibilities: "List of responsibilities/duties",
  aboutCompany: "Information about the company",
  benefits: "Benefits/perks information"
};

/**
 * Generates a 20-character hex code for job content identification
 */
function generateJobId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Takes raw job posting text and returns structured content.
 * This is meant to be used with an LLM to extract relevant sections.
 */
export function structureJobContent(rawText: string): string {
  return JOB_CONTENT_EXTRACTION_PROMPT
    .replace("{template}", JSON.stringify(JOB_CONTENT_TEMPLATE, null, 2))
    .replace("{content}", rawText);
}

/**
 * Takes the structured content from the LLM and formats it for the final CV generation.
 * This creates a concise, focused prompt for the CV customization.
 */
export function prepareCVPrompt(jobContent: JobContent): string {
  // Remove any undefined fields
  const content = Object.fromEntries(
    Object.entries(jobContent).filter(([_, v]) => v !== undefined)
  ) as JobContent;

  return JOB_ANALYSIS_PROMPT
    .replace("{title}", content.title || "")
    .replace("{company}", content.company || "")
    .replace("{location}", content.location || "")
    .replace("{salary}", content.salary || "")
    .replace("{description}", content.description || "")
    .replace("{requirements}", content.requirements?.join('\n') || "")
    .replace("{responsibilities}", content.responsibilities?.join('\n') || "")
    .replace("{aboutCompany}", content.aboutCompany || "")
    .replace("{benefits}", content.benefits || "");
}

/**
 * Validates the structure of job content returned from the LLM
 */
export function validateJobContent(content: unknown): JobContent {
  if (typeof content !== 'object' || !content) {
    console.error("validate: Invalid job content structure");
    return { error: "validate: Invalid job content structure" };
  }

  const result: JobContent = {};
  const stringFields = [
    'title',
    'company',
    'location',
    'salary',
    'description',
    'aboutCompany'
  ] as const;

  const arrayFields = ['requirements', 'responsibilities'] as const;

  // Handle string fields
  for (const key of stringFields) {
    const value = (content as Record<string, unknown>)[key];
    if (value !== undefined && typeof value !== 'string') {
      console.error(`validate: Invalid type for field ${key}`);
      return { error: `validate: Invalid type for field ${key}` };
    }
    if (typeof value === 'string') {
      result[key] = value;
    }
  }

  // Handle array fields
  for (const key of arrayFields) {
    const value = (content as Record<string, unknown>)[key];
    if (value !== undefined && !Array.isArray(value)) {
      console.error(`validate: Invalid type for field ${key}`);
      return { error: `validate: Invalid type for field ${key}` };
    }
    if (value) {
      result[key] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
  }

  // Handle benefits which can be either string or array
  const benefits = (content as Record<string, unknown>)['benefits'];
  if (benefits !== undefined) {
    if (typeof benefits === 'string') {
      result.benefits = benefits;
    } else if (Array.isArray(benefits)) {
      result.benefits = benefits.map(String).join("\n");
    } else {
      console.error("validate: Benefits must be string or array");
      return { error: "validate: Benefits must be string or array" };
    }
  }

  // Basic validation
  if (!result.title && !result.description) {
    console.error("validate: No title or description found in job content");
    return { error: "validate: No title or description found in job content" };
  }

  return result;
}

export async function processJobContent(
  content: string,
  ai: AIService,
  db?: DatabaseService,
  url?: string
): Promise<JobContent & { id?: string }> {
  const prompt = JOB_CONTENT_PROCESSING_PROMPT
    .replace("{template}", JSON.stringify(JOB_CONTENT_TEMPLATE, null, 2))
    .replace("{content}", content);

  try {
    const response = await ai.processJobPosting(prompt);
    if (response.error || !response.content.length) {
      const error = response.error || "No content returned";
      console.error(`process: ${error}`);
      return { error: `process: ${error}` };
    }

    // Clean up any potential markdown formatting
    const cleanContent = response.content[0]
      .replace(/^```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanContent);
      const validatedContent = validateJobContent(parsed);

      // If content is valid, generate an ID
      if (!validatedContent.error) {
        const id = generateJobId();
        
        // Database storage is optional - only try if db is provided and has storeJobContent method
        if (db && 'storeJobContent' in db && url) {
          try {
            await db.storeJobContent(validatedContent, content, id, url);
          } catch (dbError) {
            console.error(`process: Failed to store job content - ${String(dbError)}`);
            // Continue even if storage fails - don't fail the whole process
          }
        }

        return { ...validatedContent, id };
      }

      return validatedContent;
    } catch (parseError) {
      console.error(`process: Invalid JSON response - ${String(parseError)}`);
      return { error: `process: Invalid JSON response - ${String(parseError)}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`process: ${message}`);
    return { error: `process: ${message}` };
  }
}

export function prepareJobPrompt(content: JobContent): string {
  return JOB_DETAILS_PROMPT
    .replace("{title}", content.title || "")
    .replace("{company}", content.company || "")
    .replace("{location}", content.location || "")
    .replace("{description}", content.description || "")
    .replace("{requirements}", content.requirements?.map(r => `• ${r}`).join("\n") || "")
    .replace("{responsibilities}", content.responsibilities?.map(r => `• ${r}`).join("\n") || "");
} 