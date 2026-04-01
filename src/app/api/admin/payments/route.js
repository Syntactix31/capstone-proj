import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listProjectPayments } from "../../../lib/db/projects";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const payments = await listProjectPayments({ includeRequired: false });
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("ADMIN PAYMENTS GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
