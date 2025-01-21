import { DOMParser } from "@b-fuze/deno-dom";
import { ParseResult } from "../../types/job.ts";
// import { Element } from "@b-fuze/deno-dom/wasm";

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

    // Remove non-content elements
    const elementsToRemove = [
      // Technical elements
      'script',
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