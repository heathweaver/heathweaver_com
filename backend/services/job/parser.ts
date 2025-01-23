import { DOMParser } from "@b-fuze/deno-dom";
import { ParseResult } from "../../types/job.ts";
import { Document } from "@b-fuze/deno-dom/wasm";
// import { Element } from "@b-fuze/deno-dom/wasm";

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
 * Attempts to extract job data from JSON-LD structured data
 */
function extractStructuredData(doc: Document): ParseResult | null {
  try {
    const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
    if (!jsonLdScript) return null;

    const data = JSON.parse(jsonLdScript.textContent || "") as JobPostingSchema;
    
    if (data["@type"] !== "JobPosting") return null;

    console.log("\nFound structured job data:", {
      title: data.title,
      company: data.hiringOrganization?.name,
    });

    return {
      success: true,
      content: data.description,
      debug: {
        contentLength: data.description.length,
        sample: data.description.substring(0, 100),
        containerFound: true,
        firstTermFound: "json-ld"
      }
    };
  } catch (err) {
    console.error("Failed to parse JSON-LD:", err);
    return null;
  }
}

/**
 * Extracts job posting content from HTML
 */
export async function extractJobContent(html: string): Promise<ParseResult> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    if (!doc) {
      console.error("parse: Failed to parse HTML");
      return { success: false, error: "parse: Failed to parse HTML" };
    }

    // console.log("\nInitial HTML length:", html.length);
    // console.log("Sample of initial content:", html.substring(0, 500));

    // First try to extract from JSON-LD
    const structuredData = extractStructuredData(doc);
    if (structuredData) {
      return structuredData;
    }

    console.log("No structured data found, falling back to HTML parsing");

    // Remove non-content elements
    const elementsToRemove = [
      // Technical elements
      'style',
      'link',
      'meta',
      'noscript',
      
      // Navigation elements
      'nav',
      'header',
      'footer',
      '[role="navigation"]',
      '[class*="breadcrumb"]',
      '[class*="menu"]',
      '[class*="navigation"]',
      
      // Sidebars and ads
      '[class*="sidebar"]',
      '[class*="cookie"]',
      '[class*="banner"]',
      '[class*="advertisement"]',
      '[class*="ads"]',
      
      // Authentication and forms
      '[class*="sign-in"]',
      '[class*="signin"]',
      '[class*="login"]',
      '[class*="auth"]',
      '[class*="register"]',
      'form',
      
      // Social and sharing
      '[class*="social"]',
      '[class*="share"]',
      
      // Alerts and popups
      '[class*="alert"]',
      '[class*="popup"]',
      '[class*="modal"]',
      '[class*="toast"]',
      
      // Common UI elements
      '[class*="header"]',
      '[class*="footer"]',
      '[class*="toolbar"]',
    ];

    elementsToRemove.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Get all text content
    const text = doc.body?.textContent || "";
    
    // Basic cleaning
    const cleanText = text
      .replace(/\s+/g, ' ')  // normalize whitespace
      .replace(/\n\s*\n/g, '\n')  // remove multiple blank lines
      .replace(/(?:Sign in|Sign up|Log in|Register|Join now|Create account).*/, '')  // remove auth text
      .replace(/Cookie Policy.*Privacy Policy.*Terms.*/, '')  // remove policy text
      .trim();

    console.log("\nCleaned text length:", cleanText.length);
    console.log("Sample of cleaned content:", cleanText);

    // Validate content
    if (cleanText.length < 100) {
      console.error("parse: Not enough content found");
      return { success: false, error: "parse: Not enough content found" };
    }

    // Look for job-related terms to validate content
    const jobTerms = [
      'job', 'position', 'role', 'responsibilities', 'requirements', 
      'qualifications', 'experience', 'skills', 'about us', 'company', 
      'team', 'salary'
    ];
    const hasJobTerms = jobTerms.some(term => cleanText.toLowerCase().includes(term));
    
    if (!hasJobTerms) {
      console.error("parse: Content doesn't appear to be a job posting");
      return { success: false, error: "parse: Content doesn't appear to be a job posting" };
    }

    return { 
      success: true, 
      content: cleanText,
      debug: {
        contentLength: cleanText.length
      }
    };

  } catch (error) {
    const message = String(error);
    console.error(`parse: ${message}`);
    return { success: false, error: `parse: ${message}` };
  }
} 