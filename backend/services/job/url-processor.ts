import { fetchJobPosting } from "./fetcher.ts";
import { extractJobContent } from "./parser.ts";
import { processJobContent } from "./processor.ts";
import { AIService } from "../../types/ai-service.types.ts";
import { DatabaseService } from "../../db/database.ts";
import { JobContent } from "../../types/job.ts";

/**
 * Processes a job posting URL through the entire pipeline:
 * URL -> HTML -> Clean Text -> Structured Data -> DB
 */
export async function processJobUrl(
  url: string,
  ai: AIService,
  db?: DatabaseService
): Promise<JobContent & { id?: string }> {
  // 1. Fetch HTML
  const fetchResult = await fetchJobPosting(url);
  if (!fetchResult.success || !fetchResult.content) {
    return { error: fetchResult.error || "No content returned from fetch" };
  }

  // 2. Parse HTML to clean text
  const parseResult = await extractJobContent(fetchResult.content);
  if (!parseResult.success || !parseResult.content) {
    return { error: parseResult.error || "No content returned from parse" };
  }

  // 3. Process text into structured data and store
  return processJobContent(parseResult.content, ai, db);
} 