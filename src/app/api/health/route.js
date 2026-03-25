import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "capstone-proj",
    timestamp: new Date().toISOString(),
  });
}
