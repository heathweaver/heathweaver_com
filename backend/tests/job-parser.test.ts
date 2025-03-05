import { assertEquals, assertExists } from "https://deno.land/std@0.217.0/assert/mod.ts";
import { extractJobContent } from "../services/job/parser.ts";

const fixturesDir = "backend/tests/fixtures/job-pages";

// Get all HTML files from fixtures directory
for await (const dirEntry of Deno.readDir(fixturesDir)) {
  if (dirEntry.isFile && dirEntry.name.endsWith('.html')) {
    Deno.test(`Job parser for ${dirEntry.name}`, async () => {
      const html = await Deno.readTextFile(`${fixturesDir}/${dirEntry.name}`);
      const result = await extractJobContent(html);
      
      assertExists(result, "Result should exist");
      assertEquals(result.success, true, "Parser should be successful");
      assertExists(result.content, "Content should exist");
      assertEquals(typeof result.content, "string", "Parsed content should be a string");
      assertEquals(result.error, undefined, "There should be no error");
    });
  }
}