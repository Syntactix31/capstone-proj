import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";

const DEFAULT_SERVICES = [
  {
    id: "S-01",
    name: "Fence Installation",
    description: "Custom fence design, materials, and full installation.",
    durationValue: 1,
    durationUnit: "days",
    price: "2800.00",
    quantity: 1,
    active: true,
  },
  {
    id: "S-02",
    name: "Deck & Railing",
    description: "Deck builds, railing upgrades, and safety repairs.",
    durationValue: 5,
    durationUnit: "days",
    price: "4500.00",
    quantity: 1,
    active: true,
  },
  {
    id: "S-03",
    name: "Pergola",
    description: "Backyard pergola installation and finishing.",
    durationValue: 3,
    durationUnit: "days",
    price: "3200.00",
    quantity: 1,
    active: true,
  },
  {
    id: "S-04",
    name: "Sod Installation",
    description: "Site prep and fresh sod installation.",
    durationValue: 1,
    durationUnit: "day",
    price: "1100.00",
    quantity: 1,
    active: false,
  },
  {
    id: "S-05",
    name: "Trees and Shrubs",
    description: "Planting, pruning, and seasonal care.",
    durationValue: 1,
    durationUnit: "day",
    price: "1100.00",
    quantity: 1,
    active: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function normalizeDurationUnit(unit) {
  const normalized = String(unit || "").trim().toLowerCase();
  if (normalized === "minutes" || normalized === "minute") return "minutes";
  if (normalized === "days" || normalized === "day") return "days";
  return "hours";
}

function formatDuration(value, unit) {
  const numericValue = Math.max(1, Number.parseInt(value || "1", 10) || 1);
  const normalizedUnit = normalizeDurationUnit(unit);
  const singularUnit =
    normalizedUnit === "minutes" ? "minute" : normalizedUnit === "days" ? "day" : "hour";
  const pluralUnit =
    normalizedUnit === "minutes" ? "minutes" : normalizedUnit === "days" ? "days" : "hours";

  return `${numericValue} ${numericValue === 1 ? singularUnit : pluralUnit}`;
}

function mapServiceRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    durationValue: Number(row.duration_value || 1),
    durationUnit: normalizeDurationUnit(row.duration_unit),
    duration: formatDuration(row.duration_value, row.duration_unit),
    price: Number(row.price || 0).toFixed(2),
    quantity: Number(row.quantity || 1),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function seedDefaultServicesIfNeeded() {
  const sql = getSql();
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM services
  `;

  if (Number(count || 0) > 0) return;

  const timestamp = nowIso();
  for (const service of DEFAULT_SERVICES) {
    await sql`
      INSERT INTO services (
        id,
        name,
        description,
        duration_value,
        duration_unit,
        price,
        quantity,
        active,
        created_at,
        updated_at
      )
      VALUES (
        ${service.id},
        ${service.name},
        ${service.description},
        ${service.durationValue},
        ${normalizeDurationUnit(service.durationUnit)},
        ${service.price},
        ${service.quantity},
        ${service.active},
        ${timestamp},
        ${timestamp}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

function sanitizeServicePayload(input = {}) {
  return {
    id: String(input.id || "").trim(),
    name: String(input.name || "").trim().slice(0, 120),
    description: String(input.description || "").trim().slice(0, 1000),
    durationValue: Math.max(1, Number.parseInt(input.durationValue || "1", 10) || 1),
    durationUnit: normalizeDurationUnit(input.durationUnit),
    price: (Number.parseFloat(input.price || "0") || 0).toFixed(2),
    quantity: Math.max(1, Number.parseInt(input.quantity || "1", 10) || 1),
    active: input.active !== false,
  };
}

async function nextServiceId() {
  const services = await listServices();
  const maxNum = services.reduce((max, service) => {
    const match = String(service.id || "").match(/^S-(\d+)$/);
    const num = match ? Number(match[1]) : 0;
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);

  return `S-${String(maxNum + 1).padStart(2, "0")}`;
}

export async function listServices() {
  await ensureDatabaseSchema();
  await seedDefaultServicesIfNeeded();
  const sql = getSql();

  const rows = await sql`
    SELECT *
    FROM services
    ORDER BY active DESC, updated_at DESC, created_at DESC
  `;

  return rows.map(mapServiceRow);
}

export async function createService(input) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();
  const payload = sanitizeServicePayload(input);
  const id = payload.id || (await nextServiceId());

  const [row] = await sql`
    INSERT INTO services (
      id,
      name,
      description,
      duration_value,
      duration_unit,
      price,
      quantity,
      active,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${payload.name},
      ${payload.description},
      ${payload.durationValue},
      ${payload.durationUnit},
      ${payload.price},
      ${payload.quantity},
      ${payload.active},
      ${timestamp},
      ${timestamp}
    )
    RETURNING *
  `;

  return row ? mapServiceRow(row) : null;
}

export async function updateService(serviceId, input) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();
  const payload = sanitizeServicePayload(input);

  const [row] = await sql`
    UPDATE services
    SET
      name = ${payload.name},
      description = ${payload.description},
      duration_value = ${payload.durationValue},
      duration_unit = ${payload.durationUnit},
      price = ${payload.price},
      quantity = ${payload.quantity},
      active = ${payload.active},
      updated_at = ${timestamp}
    WHERE id = ${serviceId}
    RETURNING *
  `;

  return row ? mapServiceRow(row) : null;
}

export async function deleteService(serviceId) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const [row] = await sql`
    DELETE FROM services
    WHERE id = ${serviceId}
    RETURNING *
  `;

  return row ? mapServiceRow(row) : null;
}
