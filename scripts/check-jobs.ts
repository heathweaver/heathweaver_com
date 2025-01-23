import { Client } from "postgres";
import "$std/dotenv/load.ts";

const client = new Client({
  hostname: Deno.env.get("POSTGRES_HOST"),
  port: Number(Deno.env.get("POSTGRES_PORT")),
  database: Deno.env.get("POSTGRES_DB"),
  user: Deno.env.get("POSTGRES_USER"),
  password: Deno.env.get("POSTGRES_PASSWORD"),
  tls: { enabled: false }
});

try {
  console.log("Connecting to database...");
  await client.connect();
  
  console.log("\nChecking jobs table...");
  const result = await client.queryObject("SELECT * FROM jobs;");
  console.log("\nFound", result.rows.length, "jobs:");
  console.log(JSON.stringify(result.rows, null, 2));

  console.log("\nChecking job_content table...");
  const contentResult = await client.queryObject("SELECT * FROM job_content;");
  console.log("\nFound", contentResult.rows.length, "job contents:");
  console.log(JSON.stringify(contentResult.rows, null, 2));

} catch (error) {
  console.error("Error:", error);
} finally {
  await client.end();
} 