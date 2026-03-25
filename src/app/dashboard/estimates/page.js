"use client";

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const STATUS_CLASS = {
  Approved: "admin-badge admin-badge--active mb-4 sm:mb-0",
  Rejected: "admin-badge admin-badge--danger mb-4 sm:mb-0",
  Pending: "admin-badge admin-badge--pending mb-4 sm:mb-0",
};

export default function AdminEstimatesDashboard() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formState, setFormState] = useState({
    client: "",
    email: "",
    service: "",
    price: "",
    status: "Pending",
    notes: "",
  });

  // =========================
  // FILE ATTACHMENT STATE
  // =========================
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");

  // =========================
  // FETCH ESTIMATES
  // =========================
  async function fetchEstimates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/estimates");
      const data = await res.json();
      setEstimates(data.estimates || []);
    } catch (e) {
      console.error(e);
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEstimates();
  }, []);

  // =========================
  // ANALYTICS
  // =========================
  const stats = useMemo(() => {
    return {
      total: estimates.length,
      approved: estimates.filter((e) => e.status === "Approved").length,
      rejected: estimates.filter((e) => e.status === "Rejected").length,
      pending: estimates.filter((e) => e.status === "Pending").length,
    };
  }, [estimates]);

  // =========================
  // CRUD ACTIONS
  // =========================
  async function createOrUpdateEstimate() {
    setBusy(true);
    try {
      const priceRaw = String(formState.price || "").trim();
      if (!priceRaw) {
        alert("Please enter a price.");
        return;
      }

      const sanitizedPrice = priceRaw.replace(/[^0-9.\-]/g, "");
      if (!sanitizedPrice || Number.isNaN(Number(sanitizedPrice))) {
        alert("Please enter a valid numeric price.");
        return;
      }

      const formData = new FormData();
      Object.entries(formState).forEach(([key, value]) => {
        const valueStr = key === "price" ? sanitizedPrice : String(value);
        formData.append(key, valueStr);
      });

      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      let res;
      if (editingId) {
        // update
        res = await fetch(`/api/admin/estimates/${editingId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        // create
        res = await fetch("/api/admin/estimates/create", {
          method: "POST",
          body: formData,
        });
      }

      if (!res.ok) {
        const text = await res.text();
        console.error("Estimate save failed:", res.status, text);
        alert("Failed to save estimate");
        return;
      }

      await fetchEstimates();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function deleteEstimate(id) {
    if (!confirm("Delete this estimate?")) return;
    setBusy(true);
    await fetch(`/api/admin/estimates/${id}`, { method: "DELETE" });
    await fetchEstimates();
    setBusy(false);
  }

  // =========================
  // FORM HANDLING
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("application/pdf")) {
      alert("Please upload a PDF file.");
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
  };

  const openForm = (estimate = null) => {
    if (estimate) {
      setEditingId(estimate.id);
      setFormState({
        client: estimate.client,
        email: estimate.email || "",
        service: estimate.service,
        price: String(estimate.price),
        status: estimate.status,
        notes: estimate.notes || "",
      });
      // If estimate has a PDF, show the attached name but don’t restore the file
      if (estimate.pdfName) {
        setPdfName(estimate.pdfName);
      } else {
        setPdfName("");
      }
      setPdfFile(null);
    } else {
      setEditingId(null);
      setFormState({
        client: "",
        email: "",
        service: "",
        price: "",
        status: "Pending",
        notes: "",
      });
      setPdfFile(null);
      setPdfName("");
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createOrUpdateEstimate();
    setIsFormOpen(false);
  };

  // =========================
  // UI
  // =========================
  return (
    <AdminLayout>
      <div className="admin-appointments">
        {/* HEADER */}
        <section className="admin-hero">
          <div>
            <h1 className="admin-title">Analytics Dashboard</h1>
            <p className="admin-subtitle">
              Manage and track all estimates.
            </p>
          </div>

          <button
            className="admin-btn admin-btn--primary"
            onClick={() => openForm()}
          >
            Add Estimate
          </button>
        </section>

        {/* STATS */}
        <section className="admin-summary-grid">
          <article className="admin-card admin-card--stat">
            <div className="admin-stat-title">Total</div>
            <div className="admin-stat-value">{stats.total}</div>
          </article>

          <article className="admin-card admin-card--stat">
            <div className="admin-stat-title">Approved</div>
            <div className="admin-stat-value">{stats.approved}</div>
          </article>

          <article className="admin-card admin-card--stat">
            <div className="admin-stat-title">Rejected</div>
            <div className="admin-stat-value">{stats.rejected}</div>
          </article>

          <article className="admin-card admin-card--stat">
            <div className="admin-stat-title">Pending</div>
            <div className="admin-stat-value">{stats.pending}</div>
          </article>
        </section>

        {/* TABLE */}
        <section className="admin-card">
          <h2 className="admin-title">All Estimates</h2>

          {loading ? (
            <p>Loading...</p>
          ) : estimates.length === 0 ? (
            <p>No estimates found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {estimates.map((e) => (
                <div
                  key={e.id}
                  className="
                    grid items-center gap-3 rounded-xl border border-slate-100 bg-white 
                    p-3 sm:p-4 transition-colors duration-200 hover:bg-slate-50
                    grid-cols-1 sm:grid-cols-[1.2fr_0.8fr_0.6fr_1.2fr]
                    sm:gap-4
                  "
                >
                  {/* First column: client + service */}
                  <div>
                    <div className="font-semibold text-slate-900">{e.client}</div>
                    <div className="text-sm text-slate-500">{e.service}</div>
                  </div>

                  {/* Second column: price */}
                  <div className="justify-self-start sm:justify-self-end sm:text-right">
                    <span className="text-slate-900">${e.price}</span>
                  </div>

                  {/* Third column: status */}
                  <span className={`${STATUS_CLASS[e.status]} justify-self-start sm:justify-self-end`}>
                    {e.status}
                  </span>

                  {/* Fourth column: actions */}
                  <div
                    className="
                      flex flex-wrap justify-start sm:justify-end items-center 
                      gap-2 sm:gap-3
                      sm:col-span-1
                    "
                  >
                    {e.pdfUrl && (
                      <a
                        href={e.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn--ghost"
                      >
                        View PDF
                      </a>
                    )}

                    <button
                      className="admin-btn admin-btn--ghost"
                      onClick={() => openForm(e)}
                    >
                      Edit
                    </button>

                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => deleteEstimate(e.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MODAL */}
        {isFormOpen && (
          <div className="admin-modal">
            <button
              className="admin-modal__backdrop"
              onClick={() => setIsFormOpen(false)}
            />

            <form className="admin-modal__content" onSubmit={handleSubmit}>
              <button
                type="button"
                aria-label="Close"
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 hover:cursor-pointer"
                onClick={() => setIsFormOpen(false)}
              >
                ✕
              </button>

              <h2 className="admin-title">
                {editingId ? "Edit Estimate" : "New Estimate"}
              </h2>

              <input
                name="client"
                placeholder="Client Name"
                value={formState.client}
                onChange={handleChange}
                required
                className="admin-input"
              />

              <input
                name="email"
                placeholder="Email"
                value={formState.email}
                onChange={handleChange}
                className="admin-input"
              />

              <input
                name="service"
                placeholder="Service"
                value={formState.service}
                onChange={handleChange}
                className="admin-input"
              />

              <input
                name="price"
                placeholder="Price"
                value={formState.price}
                onChange={handleChange}
                className="admin-input"
              />

              <select
                name="status"
                value={formState.status}
                onChange={handleChange}
                className="admin-input"
              >
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>

              <textarea
                name="notes"
                placeholder="Notes"
                value={formState.notes}
                onChange={handleChange}
                className="admin-input"
              />

              {/* FILE ATTACHMENT */}
              <div className="admin-input-group">
                <label className="admin-label">
                  Proposal Estimate PDF (optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="admin-input"
                />
                {pdfName && (
                  <div className="admin-muted">
                    Attached: {pdfName}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfName("");
                      }}
                      className="admin-link"
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>

              <button
                className="admin-btn admin-btn--primary"
                type="submit"
                disabled={busy}
              >
                {editingId ? "Update" : "Create"} Estimate
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
