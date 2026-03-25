import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/auth/server";
import { fetchClientJoinedByEmail } from "../../../lib/db/clients";
import { listProjectPayments } from "../../../lib/db/projects";

export async function GET(req) {
  const user = getRequestUser(req);
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await fetchClientJoinedByEmail(user.email);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const payments = await listProjectPayments({ clientId: client.id });
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("CLIENT PAYMENTS ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
