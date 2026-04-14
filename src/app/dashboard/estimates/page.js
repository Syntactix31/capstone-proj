"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const PAYMENT_STATUS_CLASS = {
  "Fully Paid": "admin-badge admin-badge--active",
  "Deposit Paid": "admin-badge admin-badge--pending",
  Unpaid: "admin-badge admin-badge--muted",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminQuotationsDashboard() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    let active = true;

    async function loadQuotations() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/estimates", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setQuotations([]);
          setError(data?.error || "Failed to load quotations.");
          return;
        }

        setQuotations(Array.isArray(data.quotations) ? data.quotations : []);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setQuotations([]);
        setError("Failed to load quotations.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQuotations();
    return () => {
      active = false;
    };
  }, []);

  const filteredQuotations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = quotations.filter((quotation) => {
      const matchesPayment =
        paymentFilter === "All" || quotation.paymentStatus === paymentFilter;

      if (!normalizedQuery) return matchesPayment;

      const matchesQuery =
        String(quotation.client || "").toLowerCase().includes(normalizedQuery) ||
        String(quotation.service || "").toLowerCase().includes(normalizedQuery) ||
        String(quotation.quoteNumber || "").toLowerCase().includes(normalizedQuery) ||
        String(quotation.projectId || "").toLowerCase().includes(normalizedQuery);

      return matchesPayment && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date-asc" || sortBy === "date-desc") {
        const aTime = new Date(a.sentDate || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.sentDate || b.updatedAt || b.createdAt || 0).getTime();
        return sortBy === "date-asc" ? aTime - bTime : bTime - aTime;
      }

      const aTotal = Number(a.total || 0);
      const bTotal = Number(b.total || 0);
      return sortBy === "total-asc" ? aTotal - bTotal : bTotal - aTotal;
    });
  }, [paymentFilter, query, quotations, sortBy]);

  return (
    <AdminLayout>
      <div className="admin-appointments">
        <section className="admin-hero">
          <div>
            <h1 className="admin-title">Quotations</h1>
            <p className="admin-subtitle">
              View quotations generated from the projects dashboard.
            </p>
            {error ? <p className="admin-muted">{error}</p> : null}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-header admin-projects-header">
            <h2 className="admin-card-title">Quotation list</h2>
          </div>

          <div className="admin-actions admin-projects-controls">
            <div className="admin-projects-control admin-projects-control--search">
              <input
                id="quotations-search"
                className="admin-input"
                type="search"
                placeholder="Search quotations..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search quotations"
              />
            </div>

            <div className="admin-projects-control">
              <label className="admin-projects-control-label" htmlFor="quotations-payment-filter">
                Payment
              </label>
              <select
                id="quotations-payment-filter"
                className="admin-input"
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                aria-label="Filter quotation payment status"
              >
                <option value="All">All</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Deposit Paid">Deposit Paid</option>
                <option value="Fully Paid">Fully Paid</option>
              </select>
            </div>

            <div className="admin-projects-control">
              <label className="admin-projects-control-label" htmlFor="quotations-sort">
                Sort by
              </label>
              <select
                id="quotations-sort"
                className="admin-input"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort quotations"
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
              Loading quotations...
            </p>
          ) : !quotations.length ? (
            <p>No quotations found. Generate a quotation from the projects page first.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredQuotations.map((quotation) => (
                <div
                  key={quotation.projectId}
                  className="grid items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:p-4 transition-colors duration-200 hover:bg-slate-50 grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr] sm:gap-4"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{quotation.client}</div>
                    <div className="text-sm text-slate-500">{quotation.service}</div>
                    <div className="text-xs text-slate-400">
                      Quote #{quotation.quoteNumber} · Sent {formatDate(quotation.sentDate)}
                    </div>
                  </div>

                  <div className="justify-self-start sm:justify-self-end sm:text-right">
                    <div className="text-slate-900 font-semibold">{formatCurrency(quotation.total)}</div>
                    <div className="text-xs text-slate-500">
                      Deposit {formatCurrency(quotation.depositAmount)}
                    </div>
                  </div>

                  <div className="justify-self-start sm:justify-self-end">
                    <span className={PAYMENT_STATUS_CLASS[quotation.paymentStatus] || "admin-badge admin-badge--muted"}>
                      {quotation.paymentStatus}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-start sm:justify-end items-center gap-2 sm:gap-3">
                    <Link
                      className="admin-btn admin-btn--ghost"
                      href={`/dashboard/projects/${quotation.projectId}`}
                    >
                      Open Project
                    </Link>
                    <Link
                      className="admin-btn admin-btn--primary"
                      href={`/dashboard/projects/${quotation.projectId}/quote`}
                      target="_blank"
                    >
                      Open Quotation
                    </Link>
                    {quotation.pdfUrl ? (
                      <a
                        href={quotation.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn--ghost"
                      >
                        View PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && quotations.length > 0 && !filteredQuotations.length ? (
            <p className="admin-muted" style={{ marginTop: "12px" }}>
              No quotations match current filters.
            </p>
          ) : null}
        </section>
      </div>
    </AdminLayout>
  );
}
