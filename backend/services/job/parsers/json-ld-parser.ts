import { Document } from "@b-fuze/deno-dom/wasm";
import { BaseParser } from "./base-parser.ts";
import { ParserError, ParseResult } from "../types.ts";

export class JsonLdParser extends BaseParser {
  name = "json-ld";

  async parse(doc: Document, _rawHtml: string): Promise<ParseResult> {
    const startTime = Date.now();
    const structuredData = this.extractStructuredData(doc);
    if (structuredData && this.validateContent(structuredData)) {
      return {
        success: true,
        content: structuredData,
        debug: {
          parser: this.name,
          strategy: "structured-data",
          attempts: [{
            type: "json-ld",
            success: true,
          }],
          timing: {
            start: startTime,
            end: Date.now(),
          },
          contentLength: structuredData.length,
          sample: structuredData.substring(0, 100),
          containerFound: true,
          firstTermFound: "json-ld",
        },
      };
    }

    return {
      success: false,
      content: "",
      error: {
        type: "EXTRACTION_ERROR",
        message: "No valid job data found in JSON-LD",
      },
      debug: {
        parser: this.name,
        strategy: "structured-data",
        attempts: [{
          type: "json-ld",
          success: false,
          error: {
            type: "EXTRACTION_ERROR",
            message: "No valid job data found in JSON-LD",
          },
        }],
        timing: {
          start: startTime,
          end: Date.now(),
        },
        contentLength: 0,
        sample: "",
        containerFound: false,
        firstTermFound: "none",
        errorType: "EXTRACTION_ERROR",
        fullError: "No valid job data found in JSON-LD",
      },
    };
  }

  private extractStructuredData(doc: Document): string | null {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      try {
        const jsonData = JSON.parse(script.textContent || "");

        // Handle single object or array of objects
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];

        for (const item of items) {
          // Check if it's a JobPosting
          if (item["@type"] === "JobPosting") {
            const description = item.description || "";
            if (description && typeof description === "string") {
              console.debug("Found JobPosting structured data");
              return this.cleanHtmlContent(description);
            }
          }
        }
      } catch (err) {
        console.debug("Failed to parse JSON-LD:", err);
        continue;
      }
    }

    return null;
  }
}
