import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { recordAdminActivity } from "../../../lib/admin/audit.js";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../../../lib/db/services";

function validateServicePayload(body = {}) {
  const name = String(body?.name || "").trim();
  if (!name) {
    return { error: "Service name is required." };
  }

  return {
    value: {
      name,
      description: String(body?.description || ""),
      durationValue: body?.durationValue,
      durationUnit: body?.durationUnit,
      price: body?.price,
      quantity: body?.quantity,
      active: body?.active,
    },
  };
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const services = await listServices();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("ADMIN SERVICES GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validation = validateServicePayload(body);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const service = await createService(validation.value);
    await recordAdminActivity(req, {
      action: "Created service",
      details: `Created service "${service.name}" with ${service.durationValue} ${service.durationUnit} at $${service.price}.`,
      metadata: { serviceId: service.id, serviceName: service.name },
    });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("ADMIN SERVICES POST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const serviceId = String(body?.id || "").trim();
    if (!serviceId) {
      return NextResponse.json({ error: "Missing service id" }, { status: 400 });
    }

    const validation = validateServicePayload(body);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const service = await updateService(serviceId, validation.value);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await recordAdminActivity(req, {
      action: "Updated service",
      details: `Updated service "${service.name}" and refreshed its pricing/duration settings.`,
      metadata: { serviceId: service.id, serviceName: service.name },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("ADMIN SERVICES PATCH ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const serviceId = String(searchParams.get("id") || "").trim();

    if (!serviceId) {
      return NextResponse.json({ error: "Missing service id" }, { status: 400 });
    }

    const service = await deleteService(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await recordAdminActivity(req, {
      action: "Deleted service",
      details: `Deleted service "${service.name}".`,
      metadata: { serviceId: service.id, serviceName: service.name },
    });

    return NextResponse.json({ ok: true, service });
  } catch (error) {
    console.error("ADMIN SERVICES DELETE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
