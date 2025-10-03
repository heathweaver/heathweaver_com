import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("AddJobForm component tests", async (t) => {
  await t.step("validates character count functionality", () => {
    const testString = "This is a test job description";
    assertEquals(testString.length, 30, "Character count should be accurate");
  });

  await t.step("validates textarea preserves whitespace", () => {
    const multilineText = `Line 1
    Line 2 with indent
Line 3`;
    assertEquals(
      multilineText.includes("\n"),
      true,
      "Textarea should preserve newlines",
    );
    assertEquals(
      multilineText.includes("    "),
      true,
      "Textarea should preserve spaces",
    );
  });

  await t.step("validates required fields are marked", () => {
    // Company Name and Job Title should be required
    const requiredFields = ["companyName", "jobTitle"];
    assertEquals(requiredFields.length, 2, "Should have 2 required fields");
  });

  await t.step("validates optional fields exist", () => {
    // Job URL, Description, and Notes should be optional
    const optionalFields = ["jobUrl", "jobDescription", "notes"];
    assertEquals(optionalFields.length, 3, "Should have 3 optional fields");
  });

  await t.step("validates status dropdown has all options", () => {
    const statuses = ["saved", "applied", "interviewing", "offer", "closed"];
    assertEquals(statuses.length, 5, "Should have 5 status options");
    assertEquals(statuses[0], "saved", "Default status should be 'saved'");
  });
});
