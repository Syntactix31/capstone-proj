import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../../lib/auth/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  return clearAuthCookie(res);
}

export const runtime = "nodejs";
