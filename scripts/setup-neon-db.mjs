import nextEnv from "@next/env";
import { ensureDatabaseSchema } from "../src/app/lib/db/schema.js";

const { loadEnvConfig } = nextEnv;

// Load env variables and make sure the Neon/Postgres schema exists.
async function main() {
  loadEnvConfig(process.cwd());
  await ensureDatabaseSchema();
  console.log("Neon PostgreSQL schema is ready.");
}

main().catch((error) => {
  console.error("Failed to initialize Neon PostgreSQL schema.");
  console.error(error);
  process.exit(1);
});
