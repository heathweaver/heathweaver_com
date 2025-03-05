import { Client, Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Connection configuration
const POSTGRES_CONFIG = {
  hostname: "ssc.one",
  port: 5433,
  database: "cv_rag",
  user: "cv_heathweaver",
  password: "cv_heathweaver",
};

// Create a connection pool for better performance and resource management
const pool = new Pool(POSTGRES_CONFIG, 20); // 20 connections max

export async function getClient(): Promise<Client> {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error("Failed to get database client:", error);
    throw new Error("Database connection failed");
  }
}

// Helper function to run queries with automatic client release
export async function withClient<T>(
  operation: (client: Client) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    return await operation(client);
  } finally {
    try {
      await client.release();
    } catch (releaseError) {
      console.error("Error releasing client:", releaseError);
    }
  }
}

// Helper for transactions
export async function withTransaction<T>(
  operation: (client: Client) => Promise<T>
): Promise<T> {
  return await withClient(async (client) => {
    try {
      await client.queryArray("BEGIN");
      const result = await operation(client);
      await client.queryArray("COMMIT");
      return result;
    } catch (error) {
      await client.queryArray("ROLLBACK");
      throw error;
    }
  });
} 