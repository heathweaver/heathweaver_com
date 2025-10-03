import { DOMParser } from "@b-fuze/deno-dom";
import { DebugInfo, ParserError, ParseResult } from "./types.ts";
import { Document } from "@b-fuze/deno-dom/wasm";
import { JobParser } from "./parsers/index.ts";

interface JobPostingSchema {
  "@type": string;
  title: string;
  description: string;
  datePosted: string;
  hiringOrganization: {
    "@type": string;
    name: string;
  };
}

/**
 * Converts HTML content to clean plain text while preserving structure
 */
function cleanHtmlContent(html: string): string {
  // Create a temporary document to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  if (!doc) return html;

  // Replace common elements with appropriate text
  const elementReplacements: Record<string, string> = {
    "p": "\n\n",
    "br": "\n",
    "div": "\n",
    "h1": "\n\n",
    "h2": "\n\n",
    "h3": "\n\n",
    "h4": "\n\n",
    "h5": "\n\n",
    "h6": "\n\n",
    "li": "\n• ",
    "tr": "\n",
    "th": "\t",
    "td": "\t",
  };

  // Replace elements with their text equivalents
  Object.entries(elementReplacements).forEach(([tag, replacement]) => {
    doc.querySelectorAll(tag).forEach((el) => {
      try {
        const text = el.textContent || "";
        el.textContent = `${replacement}${text}`;
      } catch (err) {
        console.debug(`Failed to process ${tag} element:`, err);
      }
    });
  });

  // Get the text content
  let text = doc.body?.textContent || html;

  // Clean up the text
  return text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n\s*\n/g, "\n\n") // Normalize line breaks
    .replace(/\t\s*\t/g, "\t") // Normalize tabs
    .replace(/•\s+/g, "• ") // Clean up bullet points
    .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
    .trim();
}

/**
 * Attempts to extract job data from JSON-LD structured data
 */
function extractStructuredData(doc: Document): ParseResult | null {
  try {
    const jsonLdScripts = doc.querySelectorAll(
      'script[type="application/ld+json"]',
    );

    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || "") as JobPostingSchema;

        if (data["@type"] === "JobPosting" && data.description) {
          console.log("\nFound structured job data:", {
            title: data.title,
            company: data.hiringOrganization?.name,
          });

          const cleanContent = cleanHtmlContent(data.description);
          return {
            success: true,
            content: cleanContent,
            debug: {
              parser: "json-ld",
              strategy: "structured-data",
              attempts: [{
                type: "json-ld",
                success: true,
              }],
              timing: {
                start: Date.now(),
                end: Date.now(),
              },
              contentLength: cleanContent.length,
              sample: cleanContent.substring(0, 100),
            },
          };
        }
      } catch (err) {
        console.debug("Failed to parse individual JSON-LD script:", err);
        continue; // Try next script if available
      }
    }
    return null;
  } catch (err) {
    console.error("Failed to parse JSON-LD:", err);
    return null;
  }
}

/**
 * Attempts to extract content from common job posting containers
 */
function extractFromContainer(doc: Document): string | null {
  const commonSelectors = [
    ".job-description",
    ".description",
    '[data-test="job-description"]',
    "#job-description",
    '[itemprop="description"]',
    ".posting-requirements",
    ".job-details",
    ".job-content",
    "article",
    "main",
    ".main-content",
  ];

  for (const selector of commonSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const rawContent = element.innerHTML || "";
      if (rawContent.length > 100) {
        const cleanContent = cleanHtmlContent(rawContent);
        if (cleanContent.length > 100) {
          return cleanContent;
        }
      }
    }
  }

  return null;
}

// Added helper function to reduce duplication in pattern matching
function tryPatterns(content: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extracts job posting content from HTML using multiple parsing strategies
 * Tries JSON-LD structured data first, then JavaScript embedded data, and finally HTML containers
 */
export async function extractJobContent(html: string): Promise<ParseResult> {
  console.debug("\nExtracting job content...");

  const parser = new JobParser();
  const result = await parser.parse(html);

  // Convert string error to ParserError if needed and ensure debug info matches type
  const finalResult: ParseResult = {
    ...result,
    content: result.content || "",
    error: result.error
      ? {
        type: "EXTRACTION_ERROR",
        message: typeof result.error === "string"
          ? result.error
          : result.error.message,
      }
      : undefined,
    debug: {
      parser: "JobParser",
      strategy: "combined",
      attempts: [],
      timing: {
        start: Date.now(),
        end: Date.now(),
      },
      contentLength: (result.content || "").length,
      sample: (result.content || "").substring(0, 100),
    },
  };

  console.debug("Parse result:", {
    success: finalResult.success,
    contentLength: finalResult.content.length,
    error: finalResult.error,
    debug: finalResult.debug,
  });

  return finalResult;
}
