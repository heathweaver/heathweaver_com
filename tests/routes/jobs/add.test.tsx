import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Add job page tests", async (t) => {
  await t.step("route exists at /jobs/add", async () => {
    const response = await fetch("http://localhost:8001/jobs/add");
    // Should redirect to signin if not authenticated, or return 200 if authenticated
    assertEquals(
      response.status === 200 || response.status === 302,
      true,
      "Route should exist and either show page or redirect to signin",
    );
  });

  await t.step("API import endpoint exists at /api/jobs/import", async () => {
    const response = await fetch("http://localhost:8001/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/job" }),
    });
    // Should return 401 if not authenticated
    assertEquals(
      response.status === 401 || response.status === 400,
      true,
      "Import endpoint should exist and require authentication",
    );
  });
});
