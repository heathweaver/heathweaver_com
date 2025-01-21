import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { prepareCVPrompt, processJobContent } from "../../backend/services/job/processor.ts";
import { AIService, AIResponse } from "../../backend/types/ai-service.types.ts";
import { JobContent } from "../../backend/types/job.ts";
import { DBJobContent } from "../../backend/services/database.ts";

// Mock AI Service for testing
class MockAIService implements AIService {
  async processJobPosting(prompt: string, _jsonSchema?: Record<string, unknown>): Promise<AIResponse> {
    // Return a mock structured response
    return {
      content: [`{
        "title": "Senior Software Engineer",
        "company": "TechCorp",
        "location": "Remote",
        "description": "Looking for an experienced engineer...",
        "requirements": ["5+ years experience", "Strong JavaScript skills"],
        "responsibilities": ["Lead development", "Mentor junior developers"]
      }`]
    };
  }
}

// Minimal mock for database operations we need
class MockDB {
  private _storedContent: DBJobContent | null = null;

  async storeJobContent(content: JobContent, rawContent: string, id: string): Promise<DBJobContent> {
    const dbContent: DBJobContent = {
      id,
      created_at: new Date(),
      raw_content: rawContent,
      ...content
    };
    this._storedContent = dbContent;
    return dbContent;
  }

  // Safe getter that throws if content is null
  get storedContent(): DBJobContent {
    if (!this._storedContent) {
      throw new Error("No content has been stored");
    }
    return this._storedContent;
  }
}

Deno.test({
  name: "prepareCVPrompt - Complete Job Content",
  fn() {
    const jobContent = {
      title: "Senior Software Engineer",
      company: "TechCorp",
      location: "Remote",
      salary: "$150,000 - $200,000",
      description: "Looking for an experienced engineer...",
      requirements: ["5+ years experience", "Strong JavaScript skills"],
      responsibilities: ["Lead development", "Mentor junior developers"],
      aboutCompany: "Fast-growing startup",
      benefits: "Health insurance, 401k"
    };

    const prompt = prepareCVPrompt(jobContent);

    // Verify all sections are included
    assertEquals(prompt.includes("Role: Senior Software Engineer"), true);
    assertEquals(prompt.includes("Company: TechCorp"), true);
    assertEquals(prompt.includes("Location: Remote"), true);
    assertEquals(prompt.includes("Compensation: $150,000 - $200,000"), true);
    assertEquals(prompt.includes("Role Overview:"), true);
    assertEquals(prompt.includes("Key Requirements:"), true);
    assertEquals(prompt.includes("Main Responsibilities:"), true);
    assertEquals(prompt.includes("About the Company:"), true);
    assertEquals(prompt.includes("Benefits:"), true);
  }
});

Deno.test({
  name: "prepareCVPrompt - Partial Job Content",
  fn() {
    const jobContent = {
      title: "Software Engineer",
      company: "TechCorp",
      description: "Looking for an engineer...",
      requirements: ["JavaScript skills"],
    };

    const prompt = prepareCVPrompt(jobContent);

    // Verify included sections
    assertEquals(prompt.includes("Role: Software Engineer"), true);
    assertEquals(prompt.includes("Company: TechCorp"), true);
    assertEquals(prompt.includes("Role Overview:"), true);
    assertEquals(prompt.includes("Key Requirements:"), true);

    // Verify excluded sections
    assertEquals(prompt.includes("Location:"), false);
    assertEquals(prompt.includes("Compensation:"), false);
    assertEquals(prompt.includes("Benefits:"), false);
  }
});

Deno.test({
  name: "processJobContent - Successfully processes job posting",
  async fn() {
    const mockAI = new MockAIService();
    const rawJobPost = `
      TechCorp is hiring a Senior Software Engineer!
      We're looking for an experienced engineer...
      Must have 5+ years experience and strong JavaScript skills.
      You will lead development and mentor junior developers.
      This is a remote position.
    `;

    const result = await processJobContent(rawJobPost, mockAI);
    
    // Verify the structure
    assertEquals(result.error, undefined);
    assertEquals(result.title, "Senior Software Engineer");
    assertEquals(result.company, "TechCorp");
    assertEquals(result.location, "Remote");
    assertEquals(result.description?.includes("experienced engineer"), true);
    assertEquals(result.requirements?.length, 2);
    assertEquals(result.requirements?.includes("5+ years experience"), true);
    assertEquals(result.responsibilities?.length, 2);
    assertEquals(result.responsibilities?.includes("Lead development"), true);
  }
});

Deno.test({
  name: "processJobContent - Handles AI error",
  async fn() {
    const errorAI: AIService = {
      async processJobPosting(_prompt: string, _jsonSchema?: Record<string, unknown>): Promise<AIResponse> {
        return { content: [], error: "AI processing failed" };
      }
    };

    const result = await processJobContent("some job post", errorAI);
    assertEquals(result.error, "process: AI processing failed");
  }
});

Deno.test({
  name: "processJobContent - Handles invalid JSON",
  async fn() {
    const invalidJsonAI: AIService = {
      async processJobPosting(_prompt: string, _jsonSchema?: Record<string, unknown>): Promise<AIResponse> {
        return { content: ["invalid json"] };
      }
    };

    const result = await processJobContent("some job post", invalidJsonAI);
    assertEquals(result.error?.startsWith("process: Invalid JSON response"), true);
  }
});

Deno.test({
  name: "processJobContent - Successfully stores job content in database",
  async fn() {
    const mockAI = new MockAIService();
    const mockDB = new MockDB();
    const rawJobPost = `
      TechCorp is hiring a Senior Software Engineer!
      We're looking for an experienced engineer...
      Must have 5+ years experience and strong JavaScript skills.
      You will lead development and mentor junior developers.
      This is a remote position.
    `;

    const result = await processJobContent(rawJobPost, mockAI, mockDB as any);
    
    // Verify the processed content
    assertEquals(result.error, undefined);
    assertEquals(result.title, "Senior Software Engineer");
    
    // Verify the stored content
    assertEquals(mockDB.storedContent?.title, "Senior Software Engineer");
    assertEquals(mockDB.storedContent?.raw_content, rawJobPost);
    assertEquals(typeof mockDB.storedContent?.created_at, "object");
    assertEquals(typeof mockDB.storedContent?.id, "string");
    assertEquals(mockDB.storedContent?.id.length, 20);  // Verify ID length
  }
}); 