import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Job import API endpoint - URL validation", async (t) => {
  await t.step("validates URL constructor works", () => {
    // Test valid URL
    const validUrl = "https://example.com/job";
    let error = null;
    try {
      new URL(validUrl);
    } catch (e) {
      error = e;
    }
    assertEquals(error, null, "Valid URL should not throw error");
  });

  await t.step("validates invalid URL format throws error", () => {
    // Test invalid URL
    const invalidUrl = "not-a-valid-url";
    let error = null;
    try {
      new URL(invalidUrl);
    } catch (e) {
      error = e;
    }
    assertEquals(error !== null, true, "Invalid URL should throw error");
  });
});
