import postgres from "postgres";

// Connection configuration
const POSTGRES_CONFIG = {
  host: "ssc.one",
  port: 5433,
  database: "cv_rag",
  user: "cv_heathweaver",
  password: "cv_heathweaver",
  max: 20, // 20 connections max
};

// Create a connection pool for better performance and resource management
export const sql = postgres(POSTGRES_CONFIG);

// Helper for transactions using postgres npm package
export async function withTransaction<T>(
  operation: (sql: postgres.Sql) => Promise<T>,
): Promise<T> {
  return await sql.begin(async (sql) => {
    return await operation(sql);
  }) as Promise<T>;
}

// Helper for non-transactional operations (replaces old withClient)
// The npm postgres package doesn't have a Client class - you use sql directly
export async function withClient<T>(
  operation: (sql: postgres.Sql) => Promise<T>,
): Promise<T> {
  return await operation(sql);
}
