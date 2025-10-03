/**
 * Result of parsing job posting content
 */
export interface ParseResult {
  success: boolean;
  content?: string;
  error?: string;
  debug?: {
    contentLength?: number;
    sample?: string;
    containerFound?: boolean;
    firstTermFound?: string;
    errorType?: string;
    fullError?: string;
    title?: string;
    company?: string;
  };
}

/**
 * Represents structured content extracted from a job posting
 */
export interface JobContent {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  aboutCompany?: string;
  benefits?: string;
  error?: string;
}

/**
 * Represents AI-generated bullet points for each job in the CV
 */
export interface JobBullets {
  jobs: Array<{
    company: string;
    bullets: string[];
  }>;
}

/**
 * Result of fetching job posting content
 */
export interface FetchResult {
  success: boolean;
  content?: string;
  error?: string;
}
