import { neon } from "@neondatabase/serverless";

let sqlInstance = null;

// Create the Neon SQL client once, then reuse it everywhere.
export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  if (!sqlInstance) {
    sqlInstance = neon(databaseUrl);
  }

  return sqlInstance;
}
