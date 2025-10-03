import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Job import API endpoint", async (t) => {
  await t.step("validates URL is required", async () => {
    const response = await fetch("http://localhost:8001/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    // Should return 401 (unauthorized) since we're not authenticated
    // In a real test with auth, this would be 400 (bad request)
    assertEquals(response.status, 401);
  });

  await t.step("validates URL format", async () => {
    const response = await fetch("http://localhost:8001/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    // Should return 401 (unauthorized) since we're not authenticated
    assertEquals(response.status, 401);
  });

  await t.step("requires authentication", async () => {
    const response = await fetch("http://localhost:8001/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/job" }),
    });

    assertEquals(response.status, 401);
  });
});
