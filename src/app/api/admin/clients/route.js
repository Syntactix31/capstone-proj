import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listClients, updateClient, upsertClient } from "../../../lib/db/clients";

const CLIENT_FIELD_LIMITS = {
  name: 30,
  email: 120,
  phone: 10,
  address: 120,
  city: 60,
  province: 60,
  propertyType: 40,
  notes: 1000,
  additionalInstructions: 1000,
};

function clampClientField(value, limit) {
  return String(value || "").slice(0, limit);
}

function clampClientPayload(input = {}) {
  return {
    ...input,
    name: clampClientField(input.name, CLIENT_FIELD_LIMITS.name),
    email: clampClientField(input.email, CLIENT_FIELD_LIMITS.email),
    phone: clampClientField(input.phone, CLIENT_FIELD_LIMITS.phone),
    address: clampClientField(input.address, CLIENT_FIELD_LIMITS.address),
    city: clampClientField(input.city, CLIENT_FIELD_LIMITS.city),
    province: clampClientField(input.province, CLIENT_FIELD_LIMITS.province),
    propertyType: clampClientField(input.propertyType, CLIENT_FIELD_LIMITS.propertyType),
    notes: clampClientField(input.notes, CLIENT_FIELD_LIMITS.notes),
    additionalInstructions: clampClientField(
      input.additionalInstructions,
      CLIENT_FIELD_LIMITS.additionalInstructions,
    ),
  };
}

// Load clients for the admin client management page.
export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const clients = await listClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("ADMIN CLIENTS GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Create a new client record from the admin page.
export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = clampClientPayload(await req.json());
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const phone = String(body?.phone || "").trim();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseClient = await upsertClient({
      name,
      email,
      phone,
      notes: body?.notes,
    });

    if (!baseClient) {
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }

    const updatedClient = await updateClient(baseClient.id, body);

    return NextResponse.json({ client: updatedClient || baseClient });
  } catch (error) {
    console.error("ADMIN CLIENTS POST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Update an existing client from the admin page.
export async function PATCH(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = clampClientPayload(await req.json());
    if (!body?.id) {
      return NextResponse.json({ error: "Missing client id" }, { status: 400 });
    }

    const client = await updateClient(body.id, body);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("ADMIN CLIENTS PATCH ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
