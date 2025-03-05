import { Document as DenoDocument } from "@b-fuze/deno-dom/wasm";

export type Document = DenoDocument;

export interface ParserError {
  type: 'HTML_PARSE_ERROR' | 'JSON_PARSE_ERROR' | 'CONTENT_VALIDATION_ERROR' | 'EXTRACTION_ERROR';
  message: string;
  details?: unknown;
}

export interface ParseResult {
  success: boolean;
  content: string;
  error?: ParserError;
  debug: DebugInfo;
  metadata?: JobMetadata;
}

export interface JobPostingSchema {
  "@type"?: string;
  title?: string;
  description: string;
  datePosted?: string;
  hiringOrganization?: {
    "@type"?: string;
    name?: string;
  };
  company?: string;
  location?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  salary?: string;
  benefits?: string;
  employmentType?: string;
  validThrough?: string;
  url?: string;
}

export interface JobMetadata {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  type?: string;
  date?: string;
}

export interface DebugInfo {
  parser: string;
  strategy: string;
  attempts: Array<{
    type: string;
    success: boolean;
    error?: ParserError;
  }>;
  timing: {
    start: number;
    end: number;
  };
  contentLength: number;
  sample: string;
  containerFound?: boolean;
  firstTermFound?: string;
  errorType?: string;
  fullError?: string;
  title?: string;
  company?: string;
}

export interface ParserConfig {
  minContentLength: number;
  minJobTerms: number;
  jobTerms: string[];
  selectors: {
    containers: string[];
    remove: string[];
  };
  cleanupPatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }>;
}

export interface ContentValidator {
  validate(content: string): {
    isValid: boolean;
    reason?: string;
    score?: number;
  };
}

export interface BaseParser {
  name: string;
  parse(doc: Document, rawHtml: string): Promise<ParseResult>;
  setConfig(config: Partial<ParserConfig>): void;
} 