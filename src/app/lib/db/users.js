import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";

// Return timestamps in a consistent ISO format for inserts and updates.
function nowIso() {
  return new Date().toISOString();
}

// Normalize emails so lookups and uniqueness checks stay consistent.
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Read the list of admin emails from env and normalize them.
export function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

// Decide whether a user should be treated as an admin or a regular client.
export function resolveRoleForEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "client";
  return getAdminEmails().includes(normalized) ? "admin" : "client";
}

// Convert raw DB column names into the object shape used by the app.
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
    provider: row.provider,
    picture: row.picture,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Find one user by email for login and OAuth flows.
export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  await ensureDatabaseSchema();
  const sql = getSql();
  const [user] = await sql`
    SELECT *
    FROM users
    WHERE email = ${normalized}
    LIMIT 1
  `;
  return mapUser(user);
}

// Create a new user record in Postgres.
export async function createUser({
  email,
  name,
  passwordHash = null,
  provider = "local",
  role = "client",
  picture = "",
}) {
  const normalized = normalizeEmail(email);
  const trimmedName = String(name || "").trim();
  const id = randomUUID();
  const timestamp = nowIso();

  await ensureDatabaseSchema();
  const sql = getSql();

  const [user] = await sql`
    INSERT INTO users (
      id,
      email,
      name,
      role,
      password_hash,
      provider,
      picture,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${normalized},
      ${trimmedName},
      ${role === "admin" ? "admin" : "client"},
      ${passwordHash},
      ${provider},
      ${String(picture || "")},
      ${timestamp},
      ${timestamp}
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING *
  `;

  if (!user) {
    throw new Error("USER_EXISTS");
  }

  return mapUser(user);
}

// Update an existing user while keeping unchanged fields intact.
export async function updateUser(userId, patch) {
  await ensureDatabaseSchema();
  const sql = getSql();

  const [current] = await sql`
    SELECT *
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (!current) return null;

  const next = {
    email: patch.email ? normalizeEmail(patch.email) : current.email,
    name: patch.name ?? current.name,
    role: patch.role === "admin" ? "admin" : patch.role === "client" ? "client" : current.role,
    passwordHash: patch.passwordHash ?? current.password_hash,
    provider: patch.provider ?? current.provider,
    picture: patch.picture ?? current.picture,
    updatedAt: nowIso(),
  };

  const [updated] = await sql`
    UPDATE users
    SET
      email = ${next.email},
      name = ${next.name},
      role = ${next.role},
      password_hash = ${next.passwordHash},
      provider = ${next.provider},
      picture = ${String(next.picture || "")},
      updated_at = ${next.updatedAt}
    WHERE id = ${userId}
    RETURNING *
  `;

  return mapUser(updated);
}
