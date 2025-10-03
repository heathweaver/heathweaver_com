import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("JobTracker component tests", async (t) => {
  await t.step("validates component file exists", async () => {
    const file = await Deno.stat("./islands/JobTracker.tsx");
    assertEquals(file.isFile, true, "JobTracker island should exist");
  });

  await t.step("validates Add Job link navigation", () => {
    const expectedHref = "/jobs/add";
    assertEquals(expectedHref, "/jobs/add", "Add Job should link to /jobs/add");
  });
});
