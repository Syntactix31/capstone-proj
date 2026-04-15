import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";

function nowIso() {
  return new Date().toISOString();
}

function parseMetadata(value) {
  if (!value) return {};

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function mapActivityRow(row) {
  return {
    id: row.id,
    adminUserId: row.admin_user_id || "",
    adminName: row.admin_name || "",
    adminEmail: row.admin_email || "",
    action: row.action || "",
    details: row.details || "",
    metadata: parseMetadata(row.metadata),
    createdAt: row.created_at,
  };
}

export async function listAdminActivity({ limit = 12 } = {}) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 50)) : 12;

  const rows = await sql`
    SELECT *
    FROM admin_activity_logs
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  return rows.map(mapActivityRow);
}

export async function createAdminActivity({
  adminUserId = "",
  adminName = "",
  adminEmail = "",
  action,
  details = "",
  metadata = {},
}) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();

  const [row] = await sql`
    INSERT INTO admin_activity_logs (
      id,
      admin_user_id,
      admin_name,
      admin_email,
      action,
      details,
      metadata,
      created_at
    )
    VALUES (
      ${randomUUID()},
      ${String(adminUserId || "").trim() || null},
      ${String(adminName || "").trim()},
      ${String(adminEmail || "").trim()},
      ${String(action || "").trim()},
      ${String(details || "").trim()},
      ${JSON.stringify(metadata || {})},
      ${timestamp}
    )
    RETURNING *
  `;

  return row ? mapActivityRow(row) : null;
}
