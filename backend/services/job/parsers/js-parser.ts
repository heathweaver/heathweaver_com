import { Document } from "@b-fuze/deno-dom/wasm";
import { BaseParser } from "./base-parser.ts";
import { ParseResult, ParserError } from "../types.ts";

export class JavaScriptParser extends BaseParser {
  name = "javascript";

  async parse(doc: Document, rawHtml: string): Promise<ParseResult> {
    const startTime = Date.now();
    console.debug("JavaScript parser: Starting extraction");
    // Try to find job data in script tags
    const scriptContent = this.extractFromScripts(doc, rawHtml);
    if (scriptContent && this.validateContent(scriptContent)) {
      console.debug("JavaScript parser: Found valid content");
      return {
        success: true,
        content: scriptContent,
        debug: {
          parser: this.name,
          strategy: "script-extraction",
          attempts: [{
            type: "javascript",
            success: true
          }],
          timing: {
            start: startTime,
            end: Date.now()
          },
          contentLength: scriptContent.length,
          sample: scriptContent.substring(0, 100),
          containerFound: true,
          firstTermFound: "script"
        }
      };
    }

    console.debug("JavaScript parser: No valid content found");
    return {
      success: false,
      content: "",
      error: {
        type: "EXTRACTION_ERROR",
        message: "No valid job data found in JavaScript"
      },
      debug: {
        parser: this.name,
        strategy: "script-extraction",
        attempts: [{
          type: "javascript",
          success: false,
          error: {
            type: "EXTRACTION_ERROR",
            message: "No valid job data found in JavaScript"
          }
        }],
        timing: {
          start: startTime,
          end: Date.now()
        },
        contentLength: 0,
        sample: "",
        containerFound: false,
        firstTermFound: "none",
        errorType: "EXTRACTION_ERROR",
        fullError: "No valid job data found in JavaScript"
      }
    };
  }

  private extractFromScripts(doc: Document, rawHtml: string): string | null {
    // Common patterns for job data in scripts
    const patterns = [
      // Zoho specific pattern - must be first to prioritize
      /var\s+jobs\s*=\s*JSON\.parse\('([^']+)'\)/i,
      // Other patterns
      /var\s+(?:job|jobPosting|jobData|posting)\s*=\s*({[^;]+});/i,
      /<script[^>]*>\s*({[\s\S]*?"jobDescription"[\s\S]*?})\s*<\/script>/i,
      /window\.[a-zA-Z]+\s*=\s*({[^;]+});/i,
      /data-job-details\s*=\s*'({[^']+})'/i
    ];

    console.debug("JavaScript parser: Checking script tags");
    // First try script tags
    const scripts = doc.querySelectorAll('script:not([type]), script[type="text/javascript"]');
    console.debug(`JavaScript parser: Found ${scripts.length} script tags`);
    
    for (const script of scripts) {
      const content = script.textContent || '';
      console.debug("JavaScript parser: Checking script content:", content.substring(0, 100) + "...");
      
      for (const pattern of patterns) {
        console.debug("JavaScript parser: Trying pattern:", pattern);
        const match = content.match(pattern);
        if (match && match[1]) {
          try {
            // Handle Zoho's escaped JSON
            const jsonStr = pattern === patterns[0] 
              ? this.unescapeZohoJson(match[1])
              : match[1];
            
            console.debug("JavaScript parser: Found match, trying to parse JSON");
            const data = JSON.parse(jsonStr);
            if (this.isJobData(data)) {
              console.debug("JavaScript parser: Found valid job data");
              return this.extractJobContent(data);
            }
          } catch (err) {
            console.debug('JavaScript parser: Failed to parse script JSON:', err);
            continue;
          }
        }
      }
    }

    console.debug("JavaScript parser: Checking raw HTML");
    // If not found in script tags, try raw HTML
    for (const pattern of patterns) {
      console.debug("JavaScript parser: Trying pattern on raw HTML:", pattern);
      const match = rawHtml.match(pattern);
      if (match && match[1]) {
        try {
          // Handle Zoho's escaped JSON
          const jsonStr = pattern === patterns[0]
            ? this.unescapeZohoJson(match[1])
            : match[1];
          
          console.debug("JavaScript parser: Found match in raw HTML, trying to parse JSON");
          const data = JSON.parse(jsonStr);
          if (this.isJobData(data)) {
            console.debug("JavaScript parser: Found valid job data in raw HTML");
            return this.extractJobContent(data);
          }
        } catch (err) {
          console.debug('JavaScript parser: Failed to parse raw HTML JSON:', err);
          continue;
        }
      }
    }

    console.debug("JavaScript parser: No job data found");
    return null;
  }

  private unescapeZohoJson(escaped: string): string {
    console.debug("JavaScript parser: Unescaping Zoho JSON");
    const unescaped = escaped.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    );
    console.debug("JavaScript parser: Unescaped first 100 chars:", unescaped.substring(0, 100));
    return unescaped;
  }

  private isJobData(data: unknown): boolean {
    if (Array.isArray(data)) {
      // Handle Zoho's array format
      const hasJobData = data.some(item => 
        item && 
        typeof item === 'object' && 
        ('Job_Description' in item || 'jobDescription' in item || 'description' in item)
      );
      console.debug("JavaScript parser: Array data has job data:", hasJobData);
      return hasJobData;
    }

    if (typeof data !== 'object' || !data) return false;
    
    const obj = data as Record<string, unknown>;
    const jobFields = [
      'Job_Description',
      'jobDescription',
      'description',
      'requirements',
      'responsibilities',
      'qualifications'
    ];

    const hasJobField = jobFields.some(field => 
      typeof obj[field] === 'string' && 
      (obj[field] as string).length > 100
    );
    console.debug("JavaScript parser: Object has job field:", hasJobField);
    return hasJobField;
  }

  private extractJobContent(data: unknown): string {
    if (Array.isArray(data)) {
      // Handle Zoho's array format
      const item = data[0];
      if (item && typeof item === 'object') {
        const content = this.cleanHtmlContent(item.Job_Description as string || '');
        console.debug("JavaScript parser: Extracted content from array (first 100 chars):", content.substring(0, 100));
        return content;
      }
    }

    const obj = data as Record<string, unknown>;
    const sections = [
      obj.Job_Description,
      obj.jobDescription,
      obj.description,
      obj.requirements,
      obj.responsibilities,
      obj.qualifications
    ].filter(section => typeof section === 'string' && section.length > 0);

    const content = this.cleanHtmlContent(sections.join('\n\n'));
    console.debug("JavaScript parser: Extracted content from object (first 100 chars):", content.substring(0, 100));
    return content;
  }
} 