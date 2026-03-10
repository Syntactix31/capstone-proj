import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listClients, updateClient, upsertClient } from "../../../lib/db/clients";

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

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
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

export async function PATCH(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
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
