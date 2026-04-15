import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/server";
import { recordAdminActivity } from "../../../../lib/admin/audit.js";
import { deleteProject, findProjectById, updateProject } from "../../../../lib/db/projects";
import { buildQuoteData } from "../../../../lib/quotes.js";
import { FIELD_LIMITS, sanitizeTextArea } from "../../../../lib/validation/fields.js";

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
      type: String(item?.type || "").trim(),
      status: String(item?.status || "Paid").trim() || "Paid",
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
    const existingProject = await findProjectById(resolvedParams.id);
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const servicesIncluded = normalizeServiceItems(body?.servicesIncluded);
    const primaryServiceName =
      String(body?.service || "").trim() || servicesIncluded[0]?.name || "";
    const shouldUpdateQuoteData =
      body?.generateQuote === true || body?.quoteData !== undefined;

    const normalizedPayments = normalizePayments(body?.payments);

    const project = await updateProject(resolvedParams.id, {
      service: primaryServiceName,
      address: sanitizeTextArea(body?.address, FIELD_LIMITS.address).trim(),
      startDate: String(body?.startDate || "").trim(),
      estimatedCompletionDate: String(body?.estimatedCompletionDate || "").trim(),
      completionDate: String(body?.completionDate || "").trim(),
      totalCost: body?.totalCost,
      servicesIncluded,
      ...(shouldUpdateQuoteData
        ? { quoteData: normalizeQuoteData(body?.quoteData || {}) }
        : {}),
      payments: normalizedPayments,
      ownerNotes: sanitizeTextArea(body?.ownerNotes, FIELD_LIMITS.notes),
      estimatePdfUrl: String(body?.estimatePdfUrl || "").trim(),
      estimatePdfName: String(body?.estimatePdfName || "").trim(),
    });

    const previousPaymentCount = Array.isArray(existingProject.payments) ? existingProject.payments.length : 0;
    const nextPaymentCount = Array.isArray(project.payments) ? project.payments.length : 0;
    const paymentCountChanged = normalizedPayments.length > 0 && nextPaymentCount !== previousPaymentCount;
    const action = paymentCountChanged ? "Recorded payment" : "Updated project";
    const details = paymentCountChanged
      ? `Recorded payment activity on project "${project.service}". Payment entries changed from ${previousPaymentCount} to ${nextPaymentCount}.`
      : `Updated project "${project.service}" details, scheduling, or quote settings.`;

    await recordAdminActivity(req, {
      action,
      details,
      metadata: {
        projectId: project.id,
        service: project.service,
        previousPaymentCount,
        nextPaymentCount,
      },
    });

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
    const existingProject = await findProjectById(resolvedParams.id);
    const deleted = await deleteProject(resolvedParams.id);

    if (!deleted?.ok && deleted?.reason === "has_active_bookings") {
      return NextResponse.json(
        {
          error: "This project cannot be deleted while it still has booked appointments. Delete it after all appointments have passed or been cancelled.",
          blockers: deleted.blockers || [],
        },
        { status: 409 }
      );
    }

    if (!deleted?.ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await recordAdminActivity(req, {
      action: "Deleted project",
      details: `Deleted project "${existingProject?.service || resolvedParams.id}".`,
      metadata: { projectId: resolvedParams.id, service: existingProject?.service || "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ADMIN PROJECT DELETE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
