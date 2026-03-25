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

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoices] = useState(INITIAL_INVOICES);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (invoice) => statusFilter === "All" || invoice.status === statusFilter
    );
  }, [invoices, statusFilter]);

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Invoices</h1>
          <p className="admin-subtitle">
            Track invoice status, issue dates, due dates, and amounts in one list.
          </p>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-projects-header">
          <h2 className="admin-card-title">Invoice list</h2>
        </div>

        <div className="admin-actions admin-projects-controls admin-invoices-controls">
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
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="admin-table admin-invoices-table">
          <div className="admin-table-row admin-table-head admin-invoices-table-row">
            <div>Invoice</div>
            <div>Client</div>
            <div>Service</div>
            <div>Issued / Due</div>
            <div>Amount</div>
            <div>Status</div>
          </div>

          {filteredInvoices.map((invoice) => (
            <div className="admin-table-row admin-invoices-table-row" key={invoice.id}>
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
