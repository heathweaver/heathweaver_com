import { Client } from "postgres";
import { config } from "../config.ts";

const client = new Client({
  hostname: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
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