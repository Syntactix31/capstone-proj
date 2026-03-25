"use client";

import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const PAYMENT_METHODS = ["E-Transfer", "Cash", "Cheque"];
const PAYMENT_TYPES = ["Initial Deposit", "Full payment"];

const INITIAL_PAYMENTS = [
  {
    id: "PAY-7001",
    client: "Jordan Lee",
    date: "2026-03-04",
    amount: 2100,
    method: "E-Transfer",
    type: "Initial Deposit",
  },
  {
    id: "PAY-7002",
    client: "Avery Chen",
    date: "2026-03-06",
    amount: 6350,
    method: "Cheque",
    type: "Full payment",
  },
  {
    id: "PAY-7003",
    client: "Taylor Singh",
    date: "2026-03-08",
    amount: 500,
    method: "Cash",
    type: "Initial Deposit",
  },
  {
    id: "PAY-7004",
    client: "Morgan Patel",
    date: "2026-03-10",
    amount: 1650,
    method: "E-Transfer",
    type: "Full payment",
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PaymentsPage() {
  const [payments] = useState(INITIAL_PAYMENTS);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesMethod =
        methodFilter === "All" || payment.method === methodFilter;
      const matchesType = typeFilter === "All" || payment.type === typeFilter;

      if (!normalizedQuery) return matchesMethod && matchesType;

      const matchesQuery =
        payment.id.toLowerCase().includes(normalizedQuery) ||
        payment.client.toLowerCase().includes(normalizedQuery) ||
        payment.date.toLowerCase().includes(normalizedQuery) ||
        payment.method.toLowerCase().includes(normalizedQuery) ||
        payment.type.toLowerCase().includes(normalizedQuery);

      return matchesMethod && matchesType && matchesQuery;
    });
  }, [methodFilter, payments, query, typeFilter]);

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Payments</h1>
          <p className="admin-subtitle">
            Track client payment records by date, amount, method, and payment type.
          </p>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-projects-header">
          <h2 className="admin-card-title">Payment list</h2>
        </div>

        <div className="admin-actions admin-projects-controls">
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
            <label className="admin-projects-control-label" htmlFor="payments-method-filter">
              Method
            </label>
            <select
              id="payments-method-filter"
              className="admin-input"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              aria-label="Filter payment method"
            >
              <option value="All">All</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
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
              {PAYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-table admin-payments-table">
          <div className="admin-table-row admin-table-head admin-payments-table-row">
            <div>Payment ID</div>
            <div>Client</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Method</div>
            <div>Type</div>
          </div>

          {filteredPayments.map((payment) => (
            <div
              className="admin-table-row admin-payments-table-row"
              key={payment.id}
            >
              <div className="admin-strong">{payment.id}</div>
              <div>{payment.client}</div>
              <div>{payment.date}</div>
              <div>{formatMoney(payment.amount)}</div>
              <div>{payment.method}</div>
              <div>{payment.type}</div>
            </div>
          ))}
        </div>

        {!filteredPayments.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No payments match current filters.
          </p>
        ) : null}
      </section>
    </AdminLayout>
  );
}
