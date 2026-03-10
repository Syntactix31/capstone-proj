import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listClients, updateClient } from "../../../lib/db/clients";

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
