import nextEnv from "@next/env";
import { ensureDatabaseSchema } from "../src/app/lib/db/schema.js";
import { getSql } from "../src/app/lib/db/client.js";

const { loadEnvConfig } = nextEnv;

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function createInvoiceId(projectId) {
  const compact = String(projectId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase();
  return `INV-${compact || "PROJECT"}`;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/reset-invoices.mjs [--commit]

Flags:
  --commit   Apply the reset. Without this flag, the script runs in dry-run mode.
`);
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

  const invoiceProjects = await sql`
    SELECT
      pr.id,
      c.name AS client_name,
      pr.service,
      pr.completion_date,
      pr.payment_status,
      pr.total_cost
    FROM projects pr
    JOIN clients c ON c.id = pr.client_id
    WHERE pr.completion_date IS NOT NULL
    ORDER BY pr.completion_date DESC, pr.updated_at DESC
  `;

  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`Invoices to reset: ${invoiceProjects.length}`);

  if (invoiceProjects.length > 0) {
    console.log("");
    console.log("Affected invoices:");
    for (const row of invoiceProjects) {
      console.log(
        `- ${createInvoiceId(row.id)} | ${row.client_name} | ${row.service} | completed ${row.completion_date}`
      );
    }
  }

  if (!commit) {
    console.log("");
    console.log("No data was changed.");
    console.log("Re-run with --commit to apply changes.");
    return;
  }

  const resetRows = await sql`
    UPDATE projects
    SET
      completion_date = NULL,
      updated_at = NOW()
    WHERE completion_date IS NOT NULL
    RETURNING id
  `;

  const [remainingInvoiceRow] = await sql`
    SELECT COUNT(*)::int AS count
    FROM projects
    WHERE completion_date IS NOT NULL
  `;

  console.log("");
  console.log("Invoice reset complete.");
  console.log(`Projects updated: ${resetRows.length}`);
  console.log(`Remaining invoice-producing projects: ${remainingInvoiceRow.count}`);
}

main().catch((error) => {
  console.error("Failed to reset invoice data.");
  console.error(error);
  process.exit(1);
});
