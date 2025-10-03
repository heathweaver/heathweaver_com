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
  db?: DatabaseService,
): Promise<JobContent & { id?: string }> {
  console.debug("\nProcessing URL:", url);

  // 1. Fetch HTML
  console.debug("1. Fetching HTML...");
  const fetchResult = await fetchJobPosting(url);
  console.debug("Fetch result:", {
    success: fetchResult.success,
    contentLength: fetchResult.content?.length,
    error: fetchResult.error,
  });

  if (!fetchResult.success || !fetchResult.content) {
    return {
      error: fetchResult.error || "No content returned from fetch",
    };
  }

  // 2. Parse HTML to clean text
  console.debug("\n2. Parsing HTML...");
  const parseResult = await extractJobContent(fetchResult.content);
  console.debug("Parse result:", {
    success: parseResult.success,
    contentLength: parseResult.content?.length,
    error: parseResult.error,
    debug: parseResult.debug,
  });

  if (!parseResult.success || !parseResult.content) {
    // Extract error message from error object
    let errorMessage = "No content returned from parse";
    if (parseResult.error) {
      if (typeof parseResult.error === 'string') {
        errorMessage = parseResult.error;
      } else if (typeof parseResult.error === 'object' && 'message' in parseResult.error) {
        errorMessage = parseResult.error.message || errorMessage;
      }
    }
    return {
      error: errorMessage,
    };
  }

  // 3. Process text into structured data and store
  console.debug("\n3. Processing content...");
  return processJobContent(parseResult.content, ai, db, url);
}
