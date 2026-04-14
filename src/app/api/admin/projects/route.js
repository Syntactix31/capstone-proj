import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { createProject, listProjects } from "../../../lib/db/projects";
import { buildQuoteData } from "../../../lib/quotes.js";
import { FIELD_LIMITS, sanitizeTextArea } from "../../../lib/validation/fields.js";

function normalizeServiceItem(value) {
  return {
    id: String(value?.id || "service-1"),
    name: String(value?.name || "").trim(),
    description: String(value?.description || "").trim(),
    price: String(value?.price || "").trim(),
    quantity: String(value?.quantity || "1").trim(),
    total: String(value?.total || "").trim(),
  };
}

function normalizeQuoteData(value) {
  return buildQuoteData(value, {
    unitPrice: value?.unitPrice ?? value?.price,
    quantity: value?.quantity,
    description: value?.description,
  });
}

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
    const service = sanitizeTextArea(body?.service, FIELD_LIMITS.serviceName).trim();
    const address = sanitizeTextArea(body?.address, FIELD_LIMITS.address).trim();
    const servicesIncluded = Array.isArray(body?.servicesIncluded)
      ? body.servicesIncluded.map(normalizeServiceItem).filter((item) => item.name)
      : [];
    const totalCost = body?.totalCost;
    const quoteData = normalizeQuoteData(body?.quoteData || {});

    if (!clientId || !service) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await createProject({
      clientId,
      service,
      address,
      totalCost,
      servicesIncluded,
      quoteData,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("ADMIN PROJECTS POST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
