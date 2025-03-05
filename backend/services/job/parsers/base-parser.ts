import { DOMParser, Document } from "@b-fuze/deno-dom/wasm";
import { ParseResult, ParserConfig } from "../types.ts";
import { HtmlCleaner } from "../utils/html-cleaner.ts";
import { JobContentValidator } from "../utils/content-validator.ts";
import { defaultConfig } from "../config.ts";

export abstract class BaseParser {
  protected config: ParserConfig;
  protected cleaner: HtmlCleaner;
  protected validator: JobContentValidator;
  abstract name: string;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.cleaner = new HtmlCleaner(this.config);
    this.validator = new JobContentValidator(this.config);
  }

  abstract parse(doc: Document, rawHtml: string): Promise<ParseResult>;

  protected validateContent(content: string): boolean {
    // Basic validation checks
    if (!content || content.length < 50) return false;

    // Check for common job content indicators
    const jobTerms = [
      'job',
      'position',
      'role',
      'work',
      'employment',
      'career',
      'opportunity',
      'responsibilities',
      'requirements',
      'qualifications',
      'experience',
      'skills',
      'about',
      'company',
      'team',
      'benefits',
      'salary',
      'compensation',
      'location',
      'remote',
      'hybrid',
      'office'
    ];

    const contentLower = content.toLowerCase();
    const hasJobTerms = jobTerms.some(term => contentLower.includes(term));
    
    // Must have at least one job-related term
    if (!hasJobTerms) return false;

    // Check content structure
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 3) return false;

    // Check for reasonable content length
    const averageLineLength = content.length / lines.length;
    if (averageLineLength < 10 || averageLineLength > 500) return false;

    return true;
  }

  protected cleanHtmlContent(content: string): string {
    return content
      // Convert HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&bull;/g, '•')
      .replace(/&middot;/g, '•')
      // Remove HTML tags while preserving structure
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, '\t')
      .replace(/<\/th>/gi, '\t')
      .replace(/<[^>]+>/g, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/gm, '')  // Trim each line
      .trim();
  }
} 