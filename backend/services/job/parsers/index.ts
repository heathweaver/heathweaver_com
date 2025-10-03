import { DOMParser } from "@b-fuze/deno-dom/wasm";
import { ParserError, ParseResult } from "../types.ts";
import { JsonLdParser } from "./json-ld-parser.ts";
import { HtmlParser } from "./html-parser.ts";
import { JavaScriptParser } from "./js-parser.ts";

export class JobParser {
  private parsers = [
    new JsonLdParser(), // Try structured data first
    new JavaScriptParser(), // Then try embedded JS data
    new HtmlParser(), // Finally try HTML containers
  ];

  async parse(html: string): Promise<ParseResult> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (!doc) {
      console.debug("Failed to parse HTML document");
      return {
        success: false,
        content: "",
        error: {
          type: "HTML_PARSE_ERROR",
          message: "Failed to parse HTML document",
        },
        debug: {
          parser: "JobParser",
          strategy: "html",
          attempts: [{
            type: "html",
            success: false,
            error: {
              type: "HTML_PARSE_ERROR",
              message: "Failed to parse HTML document",
            },
          }],
          timing: {
            start: Date.now(),
            end: Date.now(),
          },
          contentLength: 0,
          sample: "",
          containerFound: false,
          firstTermFound: "none",
          errorType: "HTML_PARSE_ERROR",
          fullError: "Failed to parse HTML document",
        },
      };
    }

    // Try each parser in sequence
    for (const parser of this.parsers) {
      try {
        console.debug(`\nTrying ${parser.name} parser...`);
        const result = await parser.parse(doc, html);
        console.debug(`${parser.name} parser result:`, {
          success: result.success,
          contentLength: result.content?.length,
          error: result.error,
          debug: result.debug,
        });

        if (result && result.success) {
          console.debug(`Successfully parsed with ${parser.name} parser`);
          return result;
        }
        console.debug(`${parser.name} parser failed, trying next...`);
      } catch (err) {
        console.debug(`Failed to parse with ${parser.name} parser:`, err);
        continue;
      }
    }

    // If all parsers fail, return failure
    console.debug("All parsers failed");
    return {
      success: false,
      content: "",
      error: {
        type: "EXTRACTION_ERROR",
        message: "All parsers failed to extract content",
      },
      debug: {
        parser: "JobParser",
        strategy: "combined",
        attempts: this.parsers.map((p) => ({
          type: p.name,
          success: false,
          error: {
            type: "EXTRACTION_ERROR",
            message: `Failed to extract with ${p.name} parser`,
          },
        })),
        timing: {
          start: Date.now(),
          end: Date.now(),
        },
        contentLength: 0,
        sample: "",
        containerFound: false,
        firstTermFound: "none",
        errorType: "EXTRACTION_ERROR",
        fullError: "All parsers failed to extract content",
      },
    };
  }
}
