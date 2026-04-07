import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/auth/server";
import { fetchClientJoinedByEmail } from "../../../lib/db/clients";
import { listProjectInvoices } from "../../../lib/db/projects";

export async function GET(req) {
  const user = getRequestUser(req);
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await fetchClientJoinedByEmail(user.email);
    if (!client) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await listProjectInvoices({ clientId: client.id });
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("CLIENT INVOICES ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
