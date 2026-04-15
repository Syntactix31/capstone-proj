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

function formatIssuedDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).split("T")[0] || "-";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export default function InvoicesPage() {
  const [sortBy, setSortBy] = useState("date-desc");
  const [query, setQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMenuId, setActiveMenuId] = useState("");

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

    const filtered = invoices.filter((invoice) => {
      if (!normalizedQuery) return true;

      const matchesQuery =
        String(invoice.client || "").toLowerCase().includes(normalizedQuery) ||
        String(invoice.id || "").toLowerCase().includes(normalizedQuery) ||
        String(invoice.project || "").toLowerCase().includes(normalizedQuery);

      return matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date-asc" || sortBy === "date-desc") {
        const aTime = new Date(a.issuedOn || 0).getTime();
        const bTime = new Date(b.issuedOn || 0).getTime();
        return sortBy === "date-asc" ? aTime - bTime : bTime - aTime;
      }

      const aAmount = Number(a.amount || 0);
      const bAmount = Number(b.amount || 0);
      return sortBy === "total-asc" ? aAmount - bAmount : bAmount - aAmount;
    });
  }, [invoices, query, sortBy]);

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
            <label className="admin-projects-control-label" htmlFor="invoices-sort">
              Sort by
            </label>
            <select
              id="invoices-sort"
              className="admin-input"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort invoices"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="total-desc">High to low</option>
              <option value="total-asc">Low to high</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            Loading invoices...
          </p>
        ) : (
          <div className="admin-table admin-invoices-table">
            <div
              className="admin-table-row admin-table-head admin-invoices-table-row"
              style={{ gridTemplateColumns: "1.3fr 1.2fr 1fr 1fr 0.9fr 1.1fr" }}
            >
              <div>Client</div>
              <div>Project</div>
              <div>Issued</div>
              <div>Amount</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredInvoices.map((invoice) => (
              <div
                className="admin-table-row admin-invoices-table-row"
                key={invoice.id}
                style={{ gridTemplateColumns: "1.3fr 1.2fr 1fr 1fr 0.9fr 1.1fr" }}
              >
                <div>{invoice.client}</div>
                <div>{invoice.project}</div>
                <div>{formatIssuedDate(invoice.issuedOn)}</div>
                <div>{formatMoney(invoice.amount)}</div>
                <div>
                  <span className={STATUS_CLASS[invoice.status] || "admin-badge"}>
                    {invoice.status}
                  </span>
                </div>
                <div className="admin-actions justify-self-end">
                  <div className="relative">
                    <button
                      className="admin-btn admin-btn--ghost"
                      type="button"
                      onClick={() =>
                        setActiveMenuId((current) => (current === invoice.id ? "" : invoice.id))
                      }
                    >
                      Manage
                    </button>
                    {activeMenuId === invoice.id ? (
                      <div className="absolute right-0 top-full z-20 mt-2 min-w-[160px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        <Link
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          href={`/dashboard/invoices/${invoice.id}`}
                          onClick={() => setActiveMenuId("")}
                        >
                          View
                        </Link>
                        <a
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          href={`/api/admin/invoices/${invoice.id}?download=1`}
                          onClick={() => setActiveMenuId("")}
                        >
                          Download
                        </a>
                      </div>
                    ) : null}
                  </div>
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
