import nextEnv from "@next/env";
import { ensureDatabaseSchema } from "../src/app/lib/db/schema.js";
import { getSql } from "../src/app/lib/db/client.js";

const { loadEnvConfig } = nextEnv;

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printUsage() {
  console.log(`
Usage:
  node scripts/reset-database.mjs [--commit]

Flags:
  --commit   Apply the reset. Without this flag, the script runs in dry-run mode.
`);
}

async function loadCounts(sql) {
  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM clients) AS clients,
      (SELECT COUNT(*)::int FROM client_properties) AS client_properties,
      (SELECT COUNT(*)::int FROM services) AS services,
      (SELECT COUNT(*)::int FROM projects) AS projects,
      (SELECT COUNT(*)::int FROM bookings) AS bookings,
      (SELECT COUNT(*)::int FROM estimates) AS estimates,
      (SELECT COUNT(*)::int FROM admin_activity_logs) AS admin_activity_logs
  `;

  return counts;
}

function printCounts(label, counts) {
  console.log(label);
  console.log(`- users: ${counts.users}`);
  console.log(`- clients: ${counts.clients}`);
  console.log(`- client_properties: ${counts.client_properties}`);
  console.log(`- services: ${counts.services}`);
  console.log(`- projects: ${counts.projects}`);
  console.log(`- bookings: ${counts.bookings}`);
  console.log(`- estimates: ${counts.estimates}`);
  console.log(`- admin_activity_logs: ${counts.admin_activity_logs}`);
}

async function main() {
  loadEnvConfig(process.cwd());

  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  await ensureDatabaseSchema();
  const sql = getSql();
  const commit = hasFlag("--commit");
  const beforeCounts = await loadCounts(sql);

  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  printCounts("Current database contents:", beforeCounts);

  if (!commit) {
    console.log("");
    console.log("No data was changed.");
    console.log("Re-run with --commit to apply the full reset.");
    return;
  }

  await sql`
    TRUNCATE TABLE
      admin_activity_logs,
      bookings,
      estimates,
      projects,
      client_properties,
      services,
      clients,
      users
    CASCADE
  `;

  const afterCounts = await loadCounts(sql);

  console.log("");
  console.log("Full database reset complete.");
  printCounts("Remaining rows after reset:", afterCounts);
}

main().catch((error) => {
  console.error("Failed to reset the database.");
  console.error(error);
  process.exit(1);
});
