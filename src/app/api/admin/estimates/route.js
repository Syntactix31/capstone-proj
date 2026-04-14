import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listAdminEstimates } from "../../../lib/db/estimates.js";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const estimates = await listAdminEstimates();
    return NextResponse.json({ estimates }, { status: 200 });
  } catch (error) {
    console.error("ADMIN ESTIMATES GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load estimates" }, { status: 500 });
  }
}
