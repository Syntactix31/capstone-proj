"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "../../../components/AdminLayout.js";
import {
  buildQuoteData,
  DEFAULT_DEPOSIT_RATE,
  DEFAULT_GST_RATE,
  formatCurrency,
  formatRateInputValue,
  todayDateValue,
} from "../../../lib/quotes.js";
import {
  FIELD_LIMITS,
  inputPropsFor,
  sanitizeIntegerInput,
  sanitizeMoneyInput,
  sanitizePercentInput,
  sanitizeTextArea,
} from "../../../lib/validation/fields.js";

const PAYMENT_TYPES = ["Initial Deposit", "Partial", "Full payment"];

function createPaymentItem() {
  return {
    id: globalThis.crypto?.randomUUID?.() || `payment-${Date.now()}-${Math.random()}`,
    date: "",
    amount: "",
    type: "Initial Deposit",
    notes: "",
  };
}

function normalizeServiceItem(project) {
  const item =
    Array.isArray(project?.servicesIncluded) && project.servicesIncluded.length
      ? project.servicesIncluded[0]
      : null;

  return {
    id: item?.id || "service-1",
    name: item?.name || project?.service || "",
    description: item?.description || "",
    price: String(item?.price || "0.00"),
    quantity: String(item?.quantity || "1"),
  };
}

function mapProjectToForm(project) {
  const hasQuote = Boolean(project?.quoteData);
  const quoteData = buildQuoteData(project?.quoteData || {}, {
    unitPrice: project?.servicesIncluded?.[0]?.price || "0.00",
    quantity: project?.servicesIncluded?.[0]?.quantity || "1",
    description: project?.servicesIncluded?.[0]?.description || "",
    sentDate: project?.quoteData?.sentDate || todayDateValue(),
    gstRate: project?.quoteData?.gstRate || DEFAULT_GST_RATE,
    depositRate: project?.quoteData?.depositRate || DEFAULT_DEPOSIT_RATE,
  });

  return {
    address: project?.address || "",
    paymentStatus: project?.paymentStatus || "Unpaid",
    startDate: project?.startDate || "",
    estimatedCompletionDate: project?.estimatedCompletionDate || "",
    completionDate: project?.completionDate || "",
    serviceItem: normalizeServiceItem(project),
    hasQuote,
    quoteData,
    payments: Array.isArray(project?.payments) ? project.payments : [],
    ownerNotes: project?.ownerNotes || "",
    estimatePdfUrl: project?.estimatePdfUrl || "",
    estimatePdfName: project?.estimatePdfName || "",
  };
}

function calculateServiceTotal(serviceItem) {
  const price = Number.parseFloat(serviceItem?.price || "0") || 0;
  const quantity = Math.max(
    1,
    Number.parseInt(serviceItem?.quantity || "1", 10) || 1
  );
  return (price * quantity).toFixed(2);
}

function calculateTotalPaid(payments) {
  return (Array.isArray(payments) ? payments : []).reduce((sum, payment) => {
    if (String(payment?.status || "Paid").trim() !== "Paid") return sum;
    return sum + (Number.parseFloat(payment?.amount || "0") || 0);
  }, 0);
}

function derivePaymentStatus({ total, depositAmount, totalPaid }) {
  if (total > 0 && Math.max(total - totalPaid, 0) <= 0.009) return "Fully Paid";
  if (depositAmount > 0 && totalPaid + 0.009 >= depositAmount) return "Deposit Paid";
  return "Unpaid";
}

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;

  const [project, setProject] = useState(null);
  const [formState, setFormState] = useState(() => mapProjectToForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentForm, setPaymentForm] = useState(() => createPaymentItem());

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    async function loadProject() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/admin/projects/${projectId}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setProject(null);
          setError(data?.error || "Failed to load project.");
          return;
        }

        setProject(data.project || null);
        setFormState(mapProjectToForm(data.project || null));
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setProject(null);
        setError("Failed to load project.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProject();
    return () => {
      active = false;
    };
  }, [projectId]);

  const serviceTotal = useMemo(
    () => calculateServiceTotal(formState.serviceItem),
    [formState.serviceItem]
  );

  const quoteTotals = useMemo(
    () =>
      buildQuoteData(formState.quoteData, {
        unitPrice: formState.serviceItem.price,
        quantity: formState.serviceItem.quantity,
        description: formState.serviceItem.description,
      }),
    [formState.quoteData, formState.serviceItem]
  );

  const totalPaid = useMemo(() => calculateTotalPaid(formState.payments), [formState.payments]);

  const remainingBalance = useMemo(() => {
    const quoteTotal = Number.parseFloat(quoteTotals.total || "0") || 0;
    return Math.max(quoteTotal - totalPaid, 0);
  }, [quoteTotals.total, totalPaid]);

  const derivedPaymentStatus = useMemo(
    () =>
      derivePaymentStatus({
        total: Number.parseFloat(quoteTotals.total || "0") || 0,
        depositAmount: Number.parseFloat(quoteTotals.depositAmount || "0") || 0,
        totalPaid,
      }),
    [quoteTotals.total, quoteTotals.depositAmount, totalPaid]
  );

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "address") nextValue = sanitizeTextArea(value, FIELD_LIMITS.address);
    if (name === "ownerNotes") nextValue = sanitizeTextArea(value, FIELD_LIMITS.notes);
    setSuccess("");
    setFormState((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleServiceChange = (field, value) => {
    let nextValue = value;
    if (field === "price") nextValue = sanitizeMoneyInput(value);
    if (field === "quantity") nextValue = sanitizeIntegerInput(value);
    if (field === "description") nextValue = sanitizeTextArea(value, FIELD_LIMITS.description);
    setSuccess("");
    setFormState((prev) => ({
      ...prev,
      serviceItem: { ...prev.serviceItem, [field]: nextValue },
    }));
  };

  const handleQuoteChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "quoteNumber") nextValue = sanitizeTextArea(value, FIELD_LIMITS.quoteNumber);
    if (name === "depositRate") nextValue = sanitizePercentInput(value);
    setSuccess("");
    setFormState((prev) => ({
      ...prev,
      quoteData: { ...prev.quoteData, [name]: nextValue },
    }));
  };

  const openNewPaymentModal = () => {
    setEditingPaymentId(null);
    setPaymentForm(createPaymentItem());
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (payment) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({
      id: payment.id,
      date: payment.date || "",
      amount: String(payment.amount || ""),
      type: payment.type || "Partial",
      notes: payment.notes || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentFormChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "amount") nextValue = sanitizeMoneyInput(value);
    if (name === "notes") nextValue = sanitizeTextArea(value, FIELD_LIMITS.notes);
    setPaymentForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const persistProject = async ({ nextPayments, successMessage = "Project details saved.", generateQuote = false, completionDate } = {}) => {
    if (!projectId) return false;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formState.address,
          paymentStatus: derivedPaymentStatus,
          startDate: formState.startDate,
          estimatedCompletionDate: formState.estimatedCompletionDate,
          completionDate: completionDate ?? formState.completionDate,
          totalCost: quoteTotals.total,
          servicesIncluded: [
            {
              ...formState.serviceItem,
              total: serviceTotal,
            },
          ],
          ...(formState.hasQuote || generateQuote
            ? {
                generateQuote,
                quoteData: {
                  ...formState.quoteData,
                  unitPrice: formState.serviceItem.price,
                  quantity: formState.serviceItem.quantity,
                  description: formState.serviceItem.description,
                },
              }
            : {}),
          payments: nextPayments ?? formState.payments,
          ownerNotes: formState.ownerNotes,
          estimatePdfUrl: formState.estimatePdfUrl,
          estimatePdfName: formState.estimatePdfName,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to save project.");
        return false;
      }

      setProject(data.project || null);
      setFormState(mapProjectToForm(data.project || null));
      setSuccess(successMessage);
      return true;
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save project.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSave = async (event) => {
    event.preventDefault();

    const nextPayment = {
      ...paymentForm,
      status: "Paid",
      amount: (Number.parseFloat(paymentForm.amount || "0") || 0).toFixed(2),
    };

    const nextPayments = editingPaymentId
      ? formState.payments.map((payment) =>
          payment.id === editingPaymentId ? nextPayment : payment
        )
      : [...formState.payments, nextPayment];

    const ok = await persistProject({
      nextPayments,
      successMessage: editingPaymentId ? "Payment updated." : "Payment recorded.",
    });

    if (!ok) return;

    setIsPaymentModalOpen(false);
    setEditingPaymentId(null);
    setPaymentForm(createPaymentItem());
  };

  const handlePaymentDelete = async () => {
    if (!editingPaymentId) return;

    const nextPayments = formState.payments.filter((payment) => payment.id !== editingPaymentId);
    const ok = await persistProject({
      nextPayments,
      successMessage: "Payment deleted.",
    });

    if (!ok) return;

    setIsPaymentModalOpen(false);
    setEditingPaymentId(null);
    setPaymentForm(createPaymentItem());
  };

  const saveProject = async ({ generateQuote = false } = {}) => {
    await persistProject({
      generateQuote,
      successMessage: generateQuote ? "Quotation generated." : "Project details saved.",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveProject();
  };

  const handleGenerateQuote = async () => {
    if ((Number.parseFloat(quoteTotals.total || "0") || 0) <= 0) {
      setError("Set a unit price and quantity before generating a quotation.");
      return;
    }

    await saveProject({ generateQuote: true });
  };

  const handleMarkCompleted = async () => {
    const ok = await persistProject({
      completionDate: todayDateValue(),
      successMessage: "Project marked as completed.",
    });
    if (ok) setConfirmAction(null);
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to delete project.");
        return;
      }

      setConfirmAction(null);
      router.push("/dashboard/projects");
      router.refresh();
    } catch (actionError) {
      console.error(actionError);
      setError("Failed to delete project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-muted">
            <Link href="/dashboard/projects" className="admin-link">
              Back to projects
            </Link>
          </p>
          <h1 className="admin-title">
            {project ? `${project.client} - ${project.service}` : "Project details"}
          </h1>
          <p className="admin-subtitle">
            Manage dates, the selected service line, quote settings, payments, notes, and estimate PDF details.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
          {success ? <p className="admin-success">{success}</p> : null}
        </div>
        {!loading && project ? (
          <div className="admin-hero-actions">
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={() => setConfirmAction("complete")}
              disabled={saving}
            >
              Mark completed
            </button>
            <button
              className="admin-btn admin-btn--danger"
              type="button"
              onClick={() => setConfirmAction("delete")}
              disabled={saving}
            >
              Delete
            </button>
          </div>
        ) : null}
      </section>

      {loading ? (
        <section className="admin-card">
          <p className="admin-muted">Loading project...</p>
        </section>
      ) : !project ? (
        <section className="admin-card">
          <p className="admin-muted">Project not found.</p>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="admin-section">
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Overview</h2>
                <div className="admin-muted">{project.id}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="admin-muted">Remaining balance</div>
                <div className="admin-title">{formatCurrency(remainingBalance)}</div>
              </div>
            </div>

            <div className="admin-form">
              <label className="admin-field">
                <span className="admin-label">Client</span>
                <input className="admin-input" value={project.client} disabled />
              </label>
              <label className="admin-field">
                <span className="admin-label">Payment status</span>
                <input className="admin-input" value={derivedPaymentStatus} disabled readOnly />
              </label>
              <label className="admin-field">
                <span className="admin-label">Address</span>
                <input
                  className="admin-input"
                  name="address"
                  {...inputPropsFor("address")}
                  value={formState.address}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Start date</span>
                <input
                  className="admin-input"
                  type="date"
                  name="startDate"
                  value={formState.startDate}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Estimated completion date</span>
                <input
                  className="admin-input"
                  type="date"
                  name="estimatedCompletionDate"
                  value={formState.estimatedCompletionDate}
                  onChange={handleFieldChange}
                />
              </label>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Service Included</h2>
            </div>

            <details className="admin-project-collapsible">
              <summary className="admin-project-collapsible__summary">
                <div>
                  <div className="admin-strong">{formState.serviceItem.name}</div>
                  <div className="admin-muted">
                    Qty {formState.serviceItem.quantity} at $
                    {(Number.parseFloat(formState.serviceItem.price || "0") || 0).toFixed(2)}
                  </div>
                </div>
                <div className="admin-strong">${serviceTotal}</div>
              </summary>

              <div className="admin-form admin-project-detail-block">
                <label className="admin-field">
                  <span className="admin-label">Price per quantity ($)</span>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.01"
                    {...inputPropsFor("money")}
                    value={formState.serviceItem.price}
                    onChange={(event) =>
                      handleServiceChange("price", event.target.value)
                    }
                  />
                </label>
                <label className="admin-field">
                  <span className="admin-label">Quantity</span>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    step="1"
                    {...inputPropsFor("quantity")}
                    value={formState.serviceItem.quantity}
                    onChange={(event) =>
                      handleServiceChange("quantity", event.target.value)
                    }
                  />
                </label>
                <label className="admin-field admin-field--full">
                  <span className="admin-label">Description</span>
                  <textarea
                    className="admin-textarea"
                    maxLength={FIELD_LIMITS.description}
                    rows={4}
                    value={formState.serviceItem.description}
                    onChange={(event) =>
                      handleServiceChange("description", event.target.value)
                    }
                  />
                </label>
              </div>
            </details>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Payments</h2>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={openNewPaymentModal}
              >
                Add payment
              </button>
            </div>

            {!formState.payments.length ? (
              <p className="admin-muted">No payments recorded yet.</p>
            ) : (
              <div className="admin-section">
                {formState.payments.map((payment) => (
                  <details className="admin-project-collapsible" key={payment.id}>
                    <summary className="admin-project-collapsible__summary">
                      <div>
                        <div className="admin-strong">
                          ${Number.parseFloat(payment.amount || "0").toFixed(2)}
                        </div>
                      <div className="admin-muted">
                          {payment.type || "Payment"} · {payment.date || "No date"}
                        </div>
                      </div>
                      <button
                        className="admin-btn admin-btn--ghost admin-btn--small"
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          openEditPaymentModal(payment);
                        }}
                      >
                        Edit
                      </button>
                    </summary>

                    <div className="admin-project-detail-block">
                      <div className="admin-muted">
                        {payment.notes || "No notes added for this payment."}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Quote, Notes and Estimate PDF</h2>
            </div>

            <div className="admin-form">
              <label className="admin-field">
                <span className="admin-label">Quote number</span>
                <input
                  className="admin-input"
                  name="quoteNumber"
                  {...inputPropsFor("quoteNumber")}
                  value={formState.quoteData.quoteNumber}
                  onChange={handleQuoteChange}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Sent date</span>
                <input
                  className="admin-input"
                  type="date"
                  name="sentDate"
                  value={formState.quoteData.sentDate}
                  onChange={handleQuoteChange}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">GST (%)</span>
                <input
                  className="admin-input"
                  value={String(DEFAULT_GST_RATE * 100)}
                  disabled
                  readOnly
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Deposit required (%)</span>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  name="depositRate"
                  {...inputPropsFor("percent")}
                  value={formatRateInputValue(formState.quoteData.depositRate)}
                  onChange={handleQuoteChange}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Quote subtotal</span>
                <input
                  className="admin-input"
                  value={formatCurrency(quoteTotals.subtotal)}
                  disabled
                  readOnly
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Quote total</span>
                <input
                  className="admin-input"
                  value={formatCurrency(quoteTotals.total)}
                  disabled
                  readOnly
                />
              </label>
              <label className="admin-field admin-field--full">
                <span className="admin-label">Owner notes (optional)</span>
                <textarea
                  className="admin-textarea"
                  rows={5}
                  name="ownerNotes"
                  maxLength={FIELD_LIMITS.notes}
                  value={formState.ownerNotes}
                  onChange={handleFieldChange}
                />
              </label>
            </div>

          </section>

          <div className="admin-modal__actions">
            <div className="admin-modal__actions-left">
              {!formState.hasQuote ? (
                <button
                  className="admin-btn admin-btn--primary"
                  type="button"
                  onClick={handleGenerateQuote}
                  disabled={saving}
                >
                  {saving ? "Generating..." : "Generate quotation"}
                </button>
              ) : (
                <Link
                  className="admin-btn admin-btn--primary"
                  href={`/dashboard/projects/${projectId}/quote`}
                  target="_blank"
                >
                  Open quotation
                </Link>
              )}
            </div>
            <div className="admin-modal__actions-right">
              <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save project"}
              </button>
              <Link className="admin-btn admin-btn--ghost" href="/dashboard/projects">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      )}

      {isPaymentModalOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close payment modal"
            onClick={() => setIsPaymentModalOpen(false)}
          />
          <form className="admin-modal__content" onSubmit={handlePaymentSave}>
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">
                  {editingPaymentId ? "Edit payment" : "Add payment"}
                </h2>
                <p className="admin-subtitle">
                  Record project payment details without expanding the whole section.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="admin-form">
              <label className="admin-field admin-field--full">
                <span className="admin-label">Amount ($)</span>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  name="amount"
                  {...inputPropsFor("money")}
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange}
                />
              </label>
              <div className="admin-form__row admin-form__row--two admin-field--full">
                <label className="admin-field">
                  <span className="admin-label">Payment date</span>
                  <input
                    className="admin-input"
                    type="date"
                    name="date"
                    value={paymentForm.date}
                    onChange={handlePaymentFormChange}
                  />
                </label>
                <label className="admin-field">
                  <span className="admin-label">Payment type</span>
                  <select
                    className="admin-input"
                    name="type"
                    value={paymentForm.type}
                    onChange={handlePaymentFormChange}
                  >
                    {PAYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="admin-field admin-field--full">
                <span className="admin-label">Notes</span>
                <textarea
                  className="admin-textarea"
                  maxLength={FIELD_LIMITS.notes}
                  rows={4}
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <div className="admin-modal__actions-left">
                {editingPaymentId ? (
                  <button
                    className="admin-btn admin-btn--danger"
                    type="button"
                    onClick={handlePaymentDelete}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <div className="admin-modal__actions-right">
                <button
                  className="admin-btn admin-btn--ghost"
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" type="submit">
                  {editingPaymentId ? "Save payment" : "Add payment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => setConfirmAction(null)}
            aria-label="Close project action confirmation"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">Are you sure?</h2>
                <p className="admin-subtitle">
                  {confirmAction === "complete"
                    ? `This will mark ${project?.client || "this project"} as completed.`
                    : confirmAction === "complete-blocked"
                      ? "Payment status needs to be Fully Paid, and at least one payment must be recorded before marking this project as completed."
                      : `This will permanently delete ${project?.client || "this project"}.`}
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-modal__actions">
              <button
                className={
                  confirmAction === "delete"
                    ? "admin-btn admin-btn--danger"
                    : "admin-btn admin-btn--primary"
                }
                type="button"
                onClick={() => {
                  if (confirmAction === "delete") {
                    handleDeleteProject();
                    return;
                  }

                  if (
                    confirmAction === "complete" &&
                    (
                      derivedPaymentStatus !== "Fully Paid" ||
                      formState.payments.length < 1
                    )
                  ) {
                    setConfirmAction("complete-blocked");
                    return;
                  }

                  if (confirmAction === "complete-blocked") {
                    setConfirmAction(null);
                    return;
                  }

                  handleMarkCompleted();
                }}
                disabled={saving}
              >
                {confirmAction === "delete"
                  ? saving
                    ? "Deleting..."
                    : "Yes, delete it"
                  : confirmAction === "complete-blocked"
                    ? "Close"
                  : saving
                    ? "Marking..."
                    : "Yes, continue"}
              </button>
              {confirmAction !== "complete-blocked" ? (
                <button
                  className="admin-btn admin-btn--ghost"
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
