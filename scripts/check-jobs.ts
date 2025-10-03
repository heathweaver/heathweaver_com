import { sql } from "../lib/db/postgres-base.ts";

try {
  console.log("Connecting to database...");

  console.log("\nChecking jobs table...");
  const result = await sql`SELECT * FROM jobs`;
  console.log("\nFound", result.length, "jobs:");
  console.log(JSON.stringify(result, null, 2));

  console.log("\nChecking job_content table...");
  const contentResult = await sql`SELECT * FROM job_content`;
  console.log("\nFound", contentResult.length, "job contents:");
  console.log(JSON.stringify(contentResult, null, 2));
} catch (error) {
  console.error("Error:", error);
} finally {
  await sql.end();
}
