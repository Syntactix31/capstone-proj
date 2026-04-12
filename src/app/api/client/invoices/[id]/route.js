import { NextResponse } from "next/server";
import { getRequestUser } from "../../../../lib/auth/server";
import { fetchClientJoinedByEmail } from "../../../../lib/db/clients";
import { findProjectInvoiceById } from "../../../../lib/db/projects";

export async function GET(req, { params }) {
  const user = getRequestUser(req);
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await fetchClientJoinedByEmail(user.email);
    if (!client) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const invoice = await findProjectInvoiceById(resolvedParams.id, { clientId: client.id });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("CLIENT INVOICE GET ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
