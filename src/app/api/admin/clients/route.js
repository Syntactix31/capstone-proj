import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { recordAdminActivity } from "../../../lib/admin/audit.js";
import { deleteClient, listClients, updateClient, upsertClient } from "../../../lib/db/clients";

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
    const client = updatedClient || baseClient;

    await recordAdminActivity(req, {
      action: "Created client",
      details: `Created client "${client.name}" (${client.email}).`,
      metadata: { clientId: client.id, clientName: client.name, clientEmail: client.email },
    });

    return NextResponse.json({ client });
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

    await recordAdminActivity(req, {
      action: "Updated client",
      details: `Updated client "${client.name}".`,
      metadata: { clientId: client.id, clientName: client.name, clientEmail: client.email },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("ADMIN CLIENTS PATCH ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete an existing client from the admin page.
export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const clientId = String(searchParams.get("id") || "").trim();

    if (!clientId) {
      return NextResponse.json({ error: "Missing client id" }, { status: 400 });
    }

    const result = await deleteClient(clientId);

    if (!result?.ok) {
      if (result?.reason === "not_found") {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      if (result?.reason === "has_dependencies") {
        const bookings = Number(result?.blockers?.bookings || 0);
        const estimates = Number(result?.blockers?.estimates || 0);
        const dependencyParts = [
          bookings ? `${bookings} booking${bookings === 1 ? "" : "s"}` : "",
          estimates ? `${estimates} estimate${estimates === 1 ? "" : "s"}` : "",
        ].filter(Boolean);

        return NextResponse.json(
          {
            error: `Cannot delete this client while ${dependencyParts.join(" and ")} still reference them.`,
            blockers: result.blockers,
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }

    await recordAdminActivity(req, {
      action: "Deleted client",
      details: `Deleted client "${result.client?.name || clientId}".`,
      metadata: {
        clientId,
        clientName: result.client?.name || "",
        clientEmail: result.client?.email || "",
      },
    });

    return NextResponse.json({ ok: true, client: result.client });
  } catch (error) {
    console.error("ADMIN CLIENTS DELETE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
