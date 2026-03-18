"use client";

import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const INITIAL_PAYMENTS = [
  {
    id: "PAY-7001",
    invoiceId: "INV-1001",
    client: "Jordan Lee",
    date: "2026-03-04",
    amount: 2100,
    method: "E-Transfer",
    status: "Pending",
  },
  {
    id: "PAY-7002",
    invoiceId: "INV-1002",
    client: "Avery Chen",
    date: "2026-03-02",
    amount: 6350,
    method: "Credit Card",
    status: "Succeeded",
  },
  {
    id: "PAY-7003",
    invoiceId: "INV-1003",
    client: "Taylor Singh",
    date: "2026-03-01",
    amount: 500,
    method: "Cash",
    status: "Refunded",
  },
  {
    id: "PAY-7004",
    invoiceId: "INV-1004",
    client: "Morgan Patel",
    date: "2026-03-03",
    amount: 1650,
    method: "Credit Card",
    status: "Failed",
  },
];

const STATUS_CLASS = {
  Succeeded: "admin-badge admin-badge--active",
  Pending: "admin-badge admin-badge--pending",
  Refunded: "admin-badge admin-badge--muted",
  Failed: "admin-badge admin-badge--pending",
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const statusOk = statusFilter === "All" || payment.status === statusFilter;
      const methodOk = methodFilter === "All" || payment.method === methodFilter;
      return statusOk && methodOk;
    });
  }, [methodFilter, payments, statusFilter]);

  const stats = useMemo(() => {
    const successful = payments.filter((p) => p.status === "Succeeded");
    const pending = payments.filter((p) => p.status === "Pending");
    const failed = payments.filter((p) => p.status === "Failed");
    return {
      totalVolume: successful.reduce((sum, p) => sum + p.amount, 0),
      successfulCount: successful.length,
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      failedCount: failed.length,
    };
  }, [payments]);

  const retryFailed = (paymentId) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId
          ? { ...payment, status: "Pending" }
          : payment
      )
    );
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Payments</p>
          <h1 className="admin-title">Transactions and collection</h1>
          <p className="admin-subtitle">
            Track payment status, methods, and retry failed transactions.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn--primary" type="button">
            Record payment
          </button>
          <button className="admin-btn admin-btn--ghost" type="button">
            Download report
          </button>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Collected</div>
          <div className="admin-stat-value">{formatMoney(stats.totalVolume)}</div>
          <div className="admin-muted">{stats.successfulCount} successful</div>
        </article>
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Pending</div>
          <div className="admin-stat-value">{formatMoney(stats.pendingAmount)}</div>
          <div className="admin-muted">Awaiting confirmation</div>
        </article>
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Failed transactions</div>
          <div className="admin-stat-value">{stats.failedCount}</div>
          <div className="admin-muted">Needs retry</div>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Payment activity</h2>
          <div className="admin-actions">
            <select
              className="admin-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter payment status"
            >
              <option value="All">All statuses</option>
              <option value="Succeeded">Succeeded</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
            <select
              className="admin-input"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter payment method"
            >
              <option value="All">All methods</option>
              <option value="Credit Card">Credit Card</option>
              <option value="E-Transfer">E-Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        <div className="admin-table">
          <div className="admin-table-row admin-table-head">
            <div>Payment ID</div>
            <div>Invoice</div>
            <div>Client</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Method</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredPayments.map((payment) => (
            <div className="admin-table-row" key={payment.id}>
              <div className="admin-strong">{payment.id}</div>
              <div>{payment.invoiceId}</div>
              <div>{payment.client}</div>
              <div>{payment.date}</div>
              <div>{formatMoney(payment.amount)}</div>
              <div>{payment.method}</div>
              <div>
                <span className={STATUS_CLASS[payment.status]}>{payment.status}</span>
              </div>
              <div className="admin-actions">
                <button className="admin-btn admin-btn--small admin-btn--ghost" type="button">
                  Receipt
                </button>
                <button
                  className="admin-btn admin-btn--small"
                  type="button"
                  disabled={payment.status !== "Failed"}
                  onClick={() => retryFailed(payment.id)}
                >
                  Retry
                </button>
              </div>
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
