"use client";

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const STATUS_CLASS = {
  Approved: "admin-badge admin-badge--active",
  Rejected: "admin-badge admin-badge--danger",
  Pending: "admin-badge admin-badge--neutral",
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
  async function createEstimate() {
    setBusy(true);
    await fetch("/api/admin/estimates/create", {
      method: "POST",
      body: JSON.stringify(formState),
    });
    await fetchEstimates();
    setBusy(false);
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

  const openForm = (estimate = null) => {
    if (estimate) {
      setEditingId(estimate.id);
      setFormState(estimate);
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
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await fetch(`/api/admin/estimates/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(formState),
      });
    } else {
      await createEstimate();
    }

    setIsFormOpen(false);
    await fetchEstimates();
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
            <p className="admin-kicker">Estimates</p>
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
            <div className="admin-table">
              {estimates.map((e) => (
                <div key={e.id} className="admin-table-row">
                  <div>
                    <div className="admin-strong">{e.client}</div>
                    <div className="admin-muted">{e.service}</div>
                  </div>

                  <div>${e.price}</div>

                  <span className={STATUS_CLASS[e.status]}>
                    {e.status}
                  </span>

                  <div className="admin-table-actions">
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

              <button className="admin-btn admin-btn--primary" type="submit">
                Save
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}