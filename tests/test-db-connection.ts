import { Client } from "postgres";
import { config } from "../config.ts";

async function testConnection() {
  const connectionConfig = {
    hostname: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    tls: { enabled: false },
  };

  console.log("Testing database connection with config:", connectionConfig);

  const client = new Client(connectionConfig);

  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("Successfully connected to database!");

    // Try a simple query
    const result = await client.queryArray(
      "SELECT current_database(), current_user",
    );
    console.log("Current database:", result.rows[0][0]);
    console.log("Current user:", result.rows[0][1]);
  } catch (error: any) {
    console.error("Failed to connect to database. Error details:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore close errors
    }
  }
}

await testConnection();
