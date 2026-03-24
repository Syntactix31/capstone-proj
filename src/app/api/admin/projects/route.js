import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { createProject, listProjects } from "../../../lib/db/projects";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("ADMIN PROJECTS GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const clientId = String(body?.clientId || "").trim();
    const service = String(body?.service || "").trim();
    const address = String(body?.address || "").trim();

    if (!clientId || !service) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await createProject({
      clientId,
      service,
      address,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("ADMIN PROJECTS POST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
