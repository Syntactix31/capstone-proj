"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPaymentDate(payment) {
  return payment.date || payment.dueDate || "-";
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/admin/payments", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (!res.ok) {
          setPayments([]);
          setError(data?.error || "Failed to load payments.");
          return;
        }

        setPayments(Array.isArray(data.payments) ? data.payments : []);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setPayments([]);
        setError("Failed to load payments.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayments();
    return () => {
      active = false;
    };
  }, []);

  const paymentTypes = useMemo(
    () => Array.from(new Set(payments.map((payment) => payment.type).filter(Boolean))).sort(),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesType = typeFilter === "All" || payment.type === typeFilter;

      if (!normalizedQuery) return matchesType;

      const matchesQuery =
        String(payment.client || "").toLowerCase().includes(normalizedQuery) ||
        String(payment.project || "").toLowerCase().includes(normalizedQuery) ||
        String(payment.date || "").toLowerCase().includes(normalizedQuery) ||
        String(payment.dueDate || "").toLowerCase().includes(normalizedQuery) ||
        String(payment.type || "").toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [payments, query, typeFilter]);

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Payments</h1>
          <p className="admin-subtitle">
            Track payments that were explicitly recorded inside project records.
          </p>
          {error ? <p className="admin-muted">{error}</p> : null}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-projects-header">
          <h2 className="admin-card-title">Payment list</h2>
        </div>

        <div className="admin-actions admin-projects-controls admin-payments-controls">
          <div className="admin-projects-control admin-projects-control--search">
            <input
              id="payments-search"
              className="admin-input"
              type="search"
              placeholder="Search payments..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search payments"
            />
          </div>

          <div className="admin-projects-control">
            <label className="admin-projects-control-label" htmlFor="payments-type-filter">
              Type
            </label>
            <select
              id="payments-type-filter"
              className="admin-input"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter payment type"
            >
              <option value="All">All</option>
              {paymentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            Loading payments...
          </p>
        ) : (
          <div className="admin-table admin-payments-table">
            <div className="admin-table-row admin-table-head admin-payments-table-row">
              <div>Client</div>
              <div>Project</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Type</div>
            </div>

            {filteredPayments.map((payment) => (
              <div className="admin-table-row admin-payments-table-row" key={payment.id}>
                <div>{payment.client}</div>
                <div>{payment.project}</div>
                <div>{formatPaymentDate(payment)}</div>
                <div>{formatMoney(payment.amount)}</div>
                <div>{payment.type || "Payment"}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && !filteredPayments.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No payments match current filters.
          </p>
        ) : null}
      </section>
    </AdminLayout>
  );
}
