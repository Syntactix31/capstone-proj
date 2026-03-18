"use client";

import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const INITIAL_INVOICES = [
  {
    id: "INV-1001",
    client: "Jordan Lee",
    service: "Fence Installation",
    issuedOn: "2026-03-01",
    dueOn: "2026-03-15",
    amount: 4200,
    status: "Sent",
  },
  {
    id: "INV-1002",
    client: "Avery Chen",
    service: "Deck & Railing",
    issuedOn: "2026-02-20",
    dueOn: "2026-03-06",
    amount: 6350,
    status: "Paid",
  },
  {
    id: "INV-1003",
    client: "Taylor Singh",
    service: "Pergola",
    issuedOn: "2026-02-12",
    dueOn: "2026-02-26",
    amount: 3900,
    status: "Overdue",
  },
  {
    id: "INV-1004",
    client: "Morgan Patel",
    service: "Fence Repair",
    issuedOn: "2026-03-03",
    dueOn: "2026-03-18",
    amount: 1650,
    status: "Draft",
  },
];

const STATUS_CLASS = {
  Draft: "admin-badge admin-badge--muted",
  Sent: "admin-badge admin-badge--pending",
  Paid: "admin-badge admin-badge--active",
  Overdue: "admin-badge admin-badge--pending",
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
      const q = query.trim().toLowerCase();
      if (!q) return matchesStatus;
      const matchesQuery =
        invoice.id.toLowerCase().includes(q) ||
        invoice.client.toLowerCase().includes(q) ||
        invoice.service.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [invoices, query, statusFilter]);

  const stats = useMemo(() => {
    const sentOrOverdue = invoices.filter((invoice) => ["Sent", "Overdue"].includes(invoice.status));
    const paid = invoices.filter((invoice) => invoice.status === "Paid");
    return {
      total: invoices.length,
      outstandingCount: sentOrOverdue.length,
      outstandingAmount: sentOrOverdue.reduce((sum, invoice) => sum + invoice.amount, 0),
      paidAmount: paid.reduce((sum, invoice) => sum + invoice.amount, 0),
    };
  }, [invoices]);

  const markPaid = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: "Paid" } : invoice
      )
    );
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Invoices</p>
          <h1 className="admin-title">Billing overview</h1>
          <p className="admin-subtitle">
            Manage draft, sent, overdue, and paid invoices in one place.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn--primary" type="button">
            New invoice
          </button>
          <button className="admin-btn admin-btn--ghost" type="button">
            Export CSV
          </button>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Total invoices</div>
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-muted">All statuses</div>
        </article>
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Outstanding</div>
          <div className="admin-stat-value">{stats.outstandingCount}</div>
          <div className="admin-muted">{formatMoney(stats.outstandingAmount)}</div>
        </article>
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Paid this cycle</div>
          <div className="admin-stat-value">{formatMoney(stats.paidAmount)}</div>
          <div className="admin-muted">Collected</div>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Invoice list</h2>
          <div className="admin-actions">
            <input
              className="admin-input"
              type="search"
              placeholder="Search client or invoice ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search invoices"
            />
            <select
              className="admin-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter invoice status"
            >
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="admin-table">
          <div className="admin-table-row admin-table-head">
            <div>Invoice</div>
            <div>Client</div>
            <div>Service</div>
            <div>Issued / Due</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredInvoices.map((invoice) => (
            <div className="admin-table-row" key={invoice.id}>
              <div className="admin-strong">{invoice.id}</div>
              <div>{invoice.client}</div>
              <div>{invoice.service}</div>
              <div>
                <div>{invoice.issuedOn}</div>
                <div className="admin-muted">Due {invoice.dueOn}</div>
              </div>
              <div>{formatMoney(invoice.amount)}</div>
              <div>
                <span className={STATUS_CLASS[invoice.status]}>{invoice.status}</span>
              </div>
              <div className="admin-actions">
                <button className="admin-btn admin-btn--small admin-btn--ghost" type="button">
                  View
                </button>
                <button
                  className="admin-btn admin-btn--small"
                  type="button"
                  disabled={invoice.status === "Paid"}
                  onClick={() => markPaid(invoice.id)}
                >
                  Mark paid
                </button>
              </div>
            </div>
          ))}
        </div>

        {!filteredInvoices.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No invoices match current filters.
          </p>
        ) : null}
      </section>
    </AdminLayout>
  );
}
