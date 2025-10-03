import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Add job page - route structure", async (t) => {
  await t.step("validates route file exists", async () => {
    // Check that the route file exists
    const routeFile = await Deno.stat("./routes/jobs/add.tsx");
    assertEquals(routeFile.isFile, true, "Route file should exist");
  });

  await t.step("validates API import file exists", async () => {
    // Check that the API endpoint file exists
    const apiFile = await Deno.stat("./routes/api/jobs/import.ts");
    assertEquals(apiFile.isFile, true, "API import endpoint file should exist");
  });

  await t.step("validates AddJobForm island exists", async () => {
    // Check that the island component exists
    const islandFile = await Deno.stat("./islands/jobs/AddJobForm.tsx");
    assertEquals(islandFile.isFile, true, "AddJobForm island should exist");
  });
});
