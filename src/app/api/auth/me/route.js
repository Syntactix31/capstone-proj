import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/auth/server";

export async function GET(req) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user }, { status: 200 });
}

export const runtime = "nodejs";
