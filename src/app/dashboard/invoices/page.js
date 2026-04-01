"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../components/AdminLayout.js";

const STATUS_CLASS = {
  Open: "admin-badge admin-badge--pending",
  Paid: "admin-badge admin-badge--active",
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInvoices() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/admin/invoices", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setInvoices([]);
          setError(data?.error || "Failed to load invoices.");
          return;
        }

        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setInvoices([]);
        setError("Failed to load invoices.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInvoices();
    return () => {
      active = false;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;

      if (!normalizedQuery) return matchesStatus;

      const matchesQuery =
        String(invoice.client || "").toLowerCase().includes(normalizedQuery) ||
        String(invoice.id || "").toLowerCase().includes(normalizedQuery) ||
        String(invoice.project || "").toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [invoices, query, statusFilter]);

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Invoices</h1>
          <p className="admin-subtitle">
            Open, download, and track invoices generated from completed projects.
          </p>
          {error ? <p className="admin-muted">{error}</p> : null}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-projects-header">
          <h2 className="admin-card-title">Invoice list</h2>
        </div>

        <div className="admin-actions admin-projects-controls">
          <div className="admin-projects-control admin-projects-control--search">
            <input
              id="invoices-search"
              className="admin-input"
              type="search"
              placeholder="Search invoices..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search invoices"
            />
          </div>

          <div className="admin-projects-control">
            <label className="admin-projects-control-label" htmlFor="invoices-status-filter">
              Status
            </label>
            <select
              id="invoices-status-filter"
              className="admin-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter invoice status"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            Loading invoices...
          </p>
        ) : (
          <div className="admin-table admin-invoices-table">
            <div className="admin-table-row admin-table-head admin-invoices-table-row">
              <div>Client</div>
              <div>Invoice ID</div>
              <div>Project</div>
              <div>Issued</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {filteredInvoices.map((invoice) => (
              <div className="admin-table-row admin-invoices-table-row" key={invoice.id}>
                <div>{invoice.client}</div>
                <div className="admin-strong">{invoice.id}</div>
                <div>{invoice.project}</div>
                <div>{invoice.issuedOn || "-"}</div>
                <div>{formatMoney(invoice.amount)}</div>
                <div>
                  <span className={STATUS_CLASS[invoice.status] || "admin-badge"}>
                    {invoice.status}
                  </span>
                </div>
                <div className="admin-actions">
                  <Link className="admin-btn admin-btn--ghost admin-btn--small" href={`/dashboard/invoices/${invoice.id}`}>
                    Open
                  </Link>
                  <a
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    href={`/api/admin/invoices/${invoice.id}?download=1`}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !filteredInvoices.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No invoices found. Invoices appear here after projects are marked completed.
          </p>
        ) : null}
      </section>
    </AdminLayout>
  );
}
