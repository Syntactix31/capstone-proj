import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listProjectInvoices } from "../../../lib/db/projects";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const invoices = await listProjectInvoices();
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("ADMIN INVOICES GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
