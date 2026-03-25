import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/server";
import { deleteProject, findProjectById, updateProject } from "../../../../lib/db/projects";
import { buildQuoteData } from "../../../../lib/quotes.js";

function normalizeServiceItems(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => ({
      id: String(item?.id || `service-${index + 1}`),
      name: String(item?.name || "").trim(),
      description: String(item?.description || "").trim(),
      price: String(item?.price || item?.pricePerQuantity || "").trim(),
      quantity: String(item?.quantity || "1").trim(),
      total: String(item?.total || "").trim(),
    }))
    .filter((item) => item.name || item.description || item.price || item.quantity);
}

function normalizePayments(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => ({
      id: String(item?.id || `payment-${index + 1}`),
      date: String(item?.date || "").trim(),
      amount: String(item?.amount || "").trim(),
      status: String(item?.status || "Pending").trim() || "Pending",
      notes: String(item?.notes || "").trim(),
    }))
    .filter((item) => item.date || item.amount || item.notes);
}

function normalizeQuoteData(value) {
  return buildQuoteData(value, {
    unitPrice: value?.unitPrice ?? value?.price,
    quantity: value?.quantity,
    description: value?.description,
  });
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const resolvedParams = await params;
    const project = await findProjectById(resolvedParams.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("ADMIN PROJECT GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const resolvedParams = await params;
    const body = await req.json();
    const servicesIncluded = normalizeServiceItems(body?.servicesIncluded);
    const primaryServiceName =
      String(body?.service || "").trim() || servicesIncluded[0]?.name || "";
    const shouldUpdateQuoteData =
      body?.generateQuote === true || body?.quoteData !== undefined;

    const project = await updateProject(resolvedParams.id, {
      service: primaryServiceName,
      address: String(body?.address || "").trim(),
      paymentStatus: String(body?.paymentStatus || "Unpaid").trim() || "Unpaid",
      startDate: String(body?.startDate || "").trim(),
      estimatedCompletionDate: String(body?.estimatedCompletionDate || "").trim(),
      completionDate: String(body?.completionDate || "").trim(),
      totalCost: body?.totalCost,
      servicesIncluded,
      ...(shouldUpdateQuoteData
        ? { quoteData: normalizeQuoteData(body?.quoteData || {}) }
        : {}),
      payments: normalizePayments(body?.payments),
      ownerNotes: String(body?.ownerNotes || ""),
      estimatePdfUrl: String(body?.estimatePdfUrl || "").trim(),
      estimatePdfName: String(body?.estimatePdfName || "").trim(),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("ADMIN PROJECT PATCH ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const resolvedParams = await params;
    const deleted = await deleteProject(resolvedParams.id);

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ADMIN PROJECT DELETE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
