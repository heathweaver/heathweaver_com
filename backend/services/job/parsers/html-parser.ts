import { Document } from "@b-fuze/deno-dom/wasm";
import { BaseParser } from "./base-parser.ts";
import { ParseResult, ParserError } from "../types.ts";

export class HtmlParser extends BaseParser {
  name = "HTML";

  private readonly selectors = [
    // Common job description containers
    ".job-description",
    "#job-description",
    '[data-test="job-description"]',
    '[itemprop="description"]',
    // Greenhouse specific
    "#grnhse_app",
    "#grnhse_content",
    "#grnhse_fullDescription",
    ".opening",
    ".opening-desc",
    ".opening-info",
    // BrassRing specific
    "#jobDetails",
    ".job-details-content",
    ".job-description-content",
    ".jobContent",
    ".jobDetailsPanelContent",
    ".jobdescriptionInJobDetails",
    // Zoho Recruit specific
    '#spandesc',
    // Article/content containers
    "article",
    ".article",
    ".content",
    ".main-content",
    "main",
    // Common job posting containers
    ".posting-requirements",
    ".job-details",
    ".job-content",
    ".prose",
    // SimplyHired specific
    ".viewjob-description",
    ".viewjob-section",
    // Workable specific
    ".job-preview",
    ".job-preview-content",
    ".job-preview-description",
    // Generic content containers
    ".description",
    ".details",
    ".details-content",
    "#content",
    "#main-content"
  ];

  async parse(doc: Document, rawHtml: string): Promise<ParseResult> {
    const startTime = Date.now();
    console.debug("HTML parser: Starting extraction");
    const debug = {
      parser: this.name,
      strategy: "container-extraction",
      attempts: [] as Array<{
        type: string;
        success: boolean;
        error?: ParserError;
      }>,
      timing: {
        start: startTime,
        end: Date.now()
      },
      contentLength: 0,
      sample: "",
      containerFound: false,
      firstTermFound: "none",
      errorType: "EXTRACTION_ERROR",
      fullError: "Failed to extract content from any source"
    };

    // Try to extract from containers first
    console.debug("HTML parser: Trying containers");
    for (const selector of this.selectors) {
      console.debug(`HTML parser: Trying selector "${selector}"`);
      const elements = doc.querySelectorAll(selector);
      
      for (const element of elements) {
        console.debug(`HTML parser: Found element with selector "${selector}"`);
        const rawContent = element.innerHTML || element.textContent || '';
        console.debug(`HTML parser: Raw content length: ${rawContent.length}`);
        
        if (rawContent.length > 0) {
          const cleanContent = this.cleanHtmlContent(rawContent);
          console.debug(`HTML parser: Clean content length: ${cleanContent.length}`);
          
          if (this.validateContent(cleanContent)) {
            console.debug("HTML parser: Content validation passed");
            debug.contentLength = cleanContent.length;
            debug.sample = cleanContent.substring(0, 100);
            debug.containerFound = true;
            debug.firstTermFound = selector;
            debug.attempts.push({
              type: "container",
              success: true
            });
            debug.timing.end = Date.now();
            return {
              success: true,
              content: cleanContent,
              debug
            };
          } else {
            console.debug("HTML parser: Content validation failed");
            debug.attempts.push({
              type: "container",
              success: false,
              error: {
                type: "CONTENT_VALIDATION_ERROR",
                message: `Content validation failed for selector ${selector}`
              }
            });
          }
        }
      }
    }

    // If no container found, try to extract from main content
    console.debug("HTML parser: Trying main content");
    const mainContent = this.extractMainContent(doc);
    if (mainContent && this.validateContent(mainContent)) {
      console.debug("HTML parser: Main content validation passed");
      debug.contentLength = mainContent.length;
      debug.sample = mainContent.substring(0, 100);
      debug.containerFound = true;
      debug.firstTermFound = "main";
      debug.attempts.push({
        type: "main",
        success: true
      });
      debug.timing.end = Date.now();
      return {
        success: true,
        content: mainContent,
        debug
      };
    }

    debug.attempts.push({
      type: "main",
      success: false,
      error: {
        type: "EXTRACTION_ERROR",
        message: "Failed to extract content from main content"
      }
    });
    debug.timing.end = Date.now();

    return {
      success: false,
      content: "",
      error: {
        type: "EXTRACTION_ERROR",
        message: "Failed to extract content from any source"
      },
      debug
    };
  }

  private extractMainContent(doc: Document): string | null {
    try {
      console.debug("HTML parser: Removing non-content elements");
      // Remove non-content elements
      const removeSelectors = [
        'header',
        'footer',
        'nav',
        '.navigation',
        '.header',
        '.footer',
        '.sidebar',
        '.menu',
        '.social-share',
        '.related-jobs',
        '.job-actions',
        '.apply-button',
        '.apply-section',
        'script',
        'style',
        'iframe',
        'form'
      ];

      for (const selector of removeSelectors) {
        doc.querySelectorAll(selector).forEach(el => {
          try {
            el.remove();
          } catch (err) {
            console.debug(`HTML parser: Failed to remove element ${selector}:`, err);
          }
        });
      }

      // Get main content
      const content = doc.body?.textContent || '';
      const cleanContent = this.cleanHtmlContent(content);
      console.debug(`HTML parser: Main content length: ${cleanContent.length}`);
      
      if (this.validateContent(cleanContent)) {
        console.debug("HTML parser: Main content validation passed");
        return cleanContent;
      } else {
        console.debug("HTML parser: Main content validation failed");
      }
    } catch (err) {
      console.debug("HTML parser: Failed to extract main content:", err);
    }
    return null;
  }
} 