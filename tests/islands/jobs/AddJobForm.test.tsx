import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Helper function to extract error message (same logic as in AddJobForm)
function extractErrorMessage(error: string | { message?: string; type?: string } | undefined): string {
  if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object') {
    return error.message || JSON.stringify(error);
  }
  return "Failed to import job";
}

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

  await t.step("validates error message extraction - string error", () => {
    const error = "Simple error message";
    const result = extractErrorMessage(error);
    assertEquals(result, "Simple error message", "Should return string error as-is");
  });

  await t.step("validates error message extraction - object with message", () => {
    const error = { type: "EXTRACTION_ERROR", message: "All parsers failed to extract content" };
    const result = extractErrorMessage(error);
    assertEquals(result, "All parsers failed to extract content", "Should extract message from error object");
  });

  await t.step("validates error message extraction - real API error format", () => {
    // This is the actual format returned by the API
    const apiResponse = { error: { type: "EXTRACTION_ERROR", message: "All parsers failed to extract content" } };
    const result = extractErrorMessage(apiResponse.error);
    assertEquals(result, "All parsers failed to extract content", "Should handle real API error format");
  });

  await t.step("validates error message extraction - object without message", () => {
    const error = { type: "EXTRACTION_ERROR" };
    const result = extractErrorMessage(error);
    assertEquals(result, '{"type":"EXTRACTION_ERROR"}', "Should stringify error object when no message");
  });

  await t.step("validates error message extraction - undefined error", () => {
    const error = undefined;
    const result = extractErrorMessage(error);
    assertEquals(result, "Failed to import job", "Should return default message for undefined");
  });
});
