import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";
import { normalizeEmail } from "./users.js";

// Return timestamps in a consistent ISO format for inserts and updates.
function nowIso() {
  return new Date().toISOString();
}

// Flatten joined client/property rows into one UI-friendly object.
function mapClientRow(row) {
  return {
    id: row.client_id,
    name: row.client_name,
    email: row.client_email,
    phone: row.phone,
    notes: row.client_notes,
    address: row.address || "",
    city: row.city || "Calgary",
    province: row.province || "Alberta",
    propertyType: row.property_type || "House",
    additionalInstructions: row.additional_instructions || "",
    propertyId: row.property_id || null,
    createdAt: row.client_created_at,
    updatedAt: row.client_updated_at,
  };
}

// Get one client and their newest property record by email.
export async function fetchClientJoinedByEmail(email) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email,
      c.phone,
      c.notes AS client_notes,
      c.created_at AS client_created_at,
      c.updated_at AS client_updated_at,
      p.id AS property_id,
      p.address,
      p.city,
      p.province,
      p.property_type,
      p.additional_instructions
    FROM clients c
    LEFT JOIN client_properties p
      ON p.client_id = c.id
    WHERE c.email = ${normalizeEmail(email)}
    ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST
    LIMIT 1
  `;
  return rows[0] ? mapClientRow(rows[0]) : null;
}

export async function fetchClientById(clientId) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email,
      c.phone,
      c.notes AS client_notes,
      c.created_at AS client_created_at,
      c.updated_at AS client_updated_at,
      p.id AS property_id,
      p.address,
      p.city,
      p.province,
      p.property_type,
      p.additional_instructions
    FROM clients c
    LEFT JOIN LATERAL (
      SELECT *
      FROM client_properties
      WHERE client_id = c.id
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE c.id = ${clientId}
    LIMIT 1
  `;

  return rows[0] ? mapClientRow(rows[0]) : null;
}

// Load all clients for the admin page, including their latest property info.
export async function listClients() {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email,
      c.phone,
      c.notes AS client_notes,
      c.created_at AS client_created_at,
      c.updated_at AS client_updated_at,
      p.id AS property_id,
      p.address,
      p.city,
      p.province,
      p.property_type,
      p.additional_instructions
    FROM clients c
    LEFT JOIN LATERAL (
      SELECT *
      FROM client_properties
      WHERE client_id = c.id
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    ) p ON TRUE
    ORDER BY c.updated_at DESC, c.created_at DESC
  `;

  return rows.map(mapClientRow);
}

// Insert a client or update the matching email if it already exists.
export async function upsertClient({
  name,
  email,
  phone = "",
  notes = "",
}) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = String(name || "").trim();
  const timestamp = nowIso();

  await ensureDatabaseSchema();
  const sql = getSql();

  const rows = await sql`
    INSERT INTO clients (
      id,
      email,
      name,
      phone,
      notes,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${normalizedEmail},
      ${trimmedName},
      ${String(phone || "")},
      ${String(notes || "")},
      ${timestamp},
      ${timestamp}
    )
    ON CONFLICT (email) DO UPDATE
    SET
      name = EXCLUDED.name,
      phone = CASE
        WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone
        ELSE clients.phone
      END,
      notes = CASE
        WHEN EXCLUDED.notes <> '' THEN EXCLUDED.notes
        ELSE clients.notes
      END,
      updated_at = EXCLUDED.updated_at
    RETURNING id
  `;

  return fetchClientJoinedByEmail(normalizedEmail);
}

// Insert or update a job-site/property record for a client.
export async function upsertClientProperty({
  clientId,
  address,
  city = "Calgary",
  province = "Alberta",
  propertyType = "House",
  additionalInstructions = "",
}) {
  const trimmedAddress = String(address || "").trim();
  if (!trimmedAddress) return null;

  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();

  const [property] = await sql`
    INSERT INTO client_properties (
      id,
      client_id,
      address,
      city,
      province,
      property_type,
      additional_instructions,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${clientId},
      ${trimmedAddress},
      ${String(city || "Calgary")},
      ${String(province || "Alberta")},
      ${String(propertyType || "House")},
      ${String(additionalInstructions || "")},
      ${timestamp},
      ${timestamp}
    )
    ON CONFLICT (client_id, address) DO UPDATE
    SET
      city = EXCLUDED.city,
      province = EXCLUDED.province,
      property_type = EXCLUDED.property_type,
      additional_instructions = EXCLUDED.additional_instructions,
      updated_at = EXCLUDED.updated_at
    RETURNING id
  `;

  return property ? { id: property.id } : null;
}

// Update both the client row and the related property details when needed.
export async function updateClient(clientId, patch) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();

  const [current] = await sql`
    SELECT *
    FROM clients
    WHERE id = ${clientId}
    LIMIT 1
  `;

  if (!current) return null;

  const nextEmail = patch.email ? normalizeEmail(patch.email) : current.email;

  await sql`
    UPDATE clients
    SET
      name = ${String(patch.name ?? current.name).trim()},
      email = ${nextEmail},
      phone = ${String(patch.phone ?? current.phone ?? "")},
      notes = ${String(patch.notes ?? current.notes ?? "")},
      updated_at = ${timestamp}
    WHERE id = ${clientId}
  `;

  const address = String(patch.address ?? "").trim();
  if (patch.propertyId || address) {
    const propertyRows = patch.propertyId
      ? await sql`
          SELECT *
          FROM client_properties
          WHERE id = ${patch.propertyId} AND client_id = ${clientId}
          LIMIT 1
        `
      : [];
    const currentProperty = propertyRows[0] || null;

    if (currentProperty) {
      await sql`
        UPDATE client_properties
        SET
          address = ${address || currentProperty.address},
          city = ${String(patch.city ?? currentProperty.city ?? "Calgary")},
          province = ${String(patch.province ?? currentProperty.province ?? "Alberta")},
          property_type = ${String(patch.propertyType ?? currentProperty.property_type ?? "House")},
          additional_instructions = ${String(
            patch.additionalInstructions ?? currentProperty.additional_instructions ?? "",
          )},
          updated_at = ${timestamp}
        WHERE id = ${currentProperty.id}
      `;
    } else if (address) {
      await upsertClientProperty({
        clientId,
        address,
        city: patch.city,
        province: patch.province,
        propertyType: patch.propertyType,
        additionalInstructions: patch.additionalInstructions,
      });
    }
  }

  const rows = await sql`
    SELECT
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email,
      c.phone,
      c.notes AS client_notes,
      c.created_at AS client_created_at,
      c.updated_at AS client_updated_at,
      p.id AS property_id,
      p.address,
      p.city,
      p.province,
      p.property_type,
      p.additional_instructions
    FROM clients c
    LEFT JOIN LATERAL (
      SELECT *
      FROM client_properties
      WHERE client_id = c.id
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE c.id = ${clientId}
    LIMIT 1
  `;

  return rows[0] ? mapClientRow(rows[0]) : null;
}

// Delete a client when no restricted child records still depend on it.
export async function deleteClient(clientId) {
  await ensureDatabaseSchema();
  const sql = getSql();

  const [client] = await sql`
    SELECT id, name
    FROM clients
    WHERE id = ${clientId}
    LIMIT 1
  `;

  if (!client) {
    return { ok: false, reason: "not_found" };
  }

  const [dependencyCounts] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM bookings WHERE client_id = ${clientId}) AS bookings_count,
      (SELECT COUNT(*)::int FROM estimates WHERE client_id = ${clientId}) AS estimates_count
  `;

  const bookingsCount = Number(dependencyCounts?.bookings_count || 0);
  const estimatesCount = Number(dependencyCounts?.estimates_count || 0);

  if (bookingsCount > 0 || estimatesCount > 0) {
    return {
      ok: false,
      reason: "has_dependencies",
      client: {
        id: client.id,
        name: client.name,
      },
      blockers: {
        bookings: bookingsCount,
        estimates: estimatesCount,
      },
    };
  }

  await sql`
    DELETE FROM clients
    WHERE id = ${clientId}
  `;

  return {
    ok: true,
    client: {
      id: client.id,
      name: client.name,
    },
  };
}
