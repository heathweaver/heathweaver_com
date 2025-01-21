import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { CVGenerator } from "../../backend/services/cv/cv-generator.ts";
import { CVLoader } from "../../backend/services/cv/cv-loader.ts";
import { XAIService } from "../../backend/services/ai/xai.ts";
import { DatabaseService } from "../../backend/db/database.ts";
import { config } from "../../config.ts";

Deno.test({
  name: "CV Generation - Full Flow Integration Test",
  async fn() {
    // Test data
    const jobData = {
      jobTitle: "Software Engineering Manager",
      company: "TechCorp",
      jobDescription: "Leading a team of software engineers...",
      requirements: "5+ years of engineering experience\nStrong leadership skills",
      responsibilities: "Team management\nTechnical architecture\nAgile processes"
    };

    // Initialize services
    const aiService = new XAIService(config.xai_api_key);
    const db = new DatabaseService();
    await db.connect();
    const cvGenerator = new CVGenerator(aiService, db);

    try {
      // Generate CV
      const cv = await cvGenerator.generateCV(jobData);

      // Basic assertions to ensure CV structure is correct
      assertExists(cv.basicInfo, "CV should have basic info");
      assertExists(cv.headline, "CV should have a headline");
      assertExists(cv.profile, "CV should have a profile");
      assertExists(cv.employmentHistory, "CV should have employment history");
      
      // Verify content relevance
      assertEquals(typeof cv.headline, "string", "Headline should be a string");
      assertEquals(typeof cv.profile, "string", "Profile should be a string");
      assertEquals(Array.isArray(cv.employmentHistory), true, "Employment history should be an array");
      
      // Verify employment history structure
      if (cv.employmentHistory.length > 0) {
        const firstJob = cv.employmentHistory[0];
        assertExists(firstJob.title, "Job should have a title");
        assertExists(firstJob.start_date, "Job should have a start date");
        assertExists(firstJob.location, "Job should have a location");
        assertExists(firstJob.bulletPoints, "Job should have bullet points");
      }
    } finally {
      // Ensure database connection is closed
      await db.disconnect();
    }
  }
});

Deno.test({
  name: "JSON CV Provider Test",
  async fn() {
    // Create a temporary test CV JSON
    const testCV = {
      basicInfo: {
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
        location: "San Francisco, CA",
        title: "Software Engineer"
      },
      headline: "INNOVATIVE SOFTWARE ENGINEER",
      profile: "Experienced engineer...",
      employmentHistory: [{
        company: "TechCorp",
        title: "Senior Engineer",
        start_date: "2020-01",
        end_date: "Present",
        location: "San Francisco, CA",
        bulletPoints: [{ content: "Led development of key features" }]
      }]
    };

    const tempFile = await Deno.makeTempFile({ suffix: ".json" });
    await Deno.writeTextFile(tempFile, JSON.stringify(testCV));

    try {
      // Test JSON loading
      const cvLoader = new CVLoader(tempFile);
      const loadedCV = await cvLoader.loadCV();

      assertEquals(loadedCV.basicInfo.name, testCV.basicInfo.name);
      assertEquals(loadedCV.headline, testCV.headline);
      assertEquals(loadedCV.employmentHistory[0].title, testCV.employmentHistory[0].title);
    } finally {
      // Cleanup
      await Deno.remove(tempFile);
    }
  }
}); 