"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../components/AdminLayout.js";
import { downloadInvoicePdf } from "../../lib/invoices/pdf.js";

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
  const [menuPosition, setMenuPosition] = useState({ top: 16, left: 16, width: 184, maxHeight: 180 });
  const menuButtonRefs = useRef({});
  const menuRef = useRef(null);

  const handleDownload = async (invoice) => {
    await downloadInvoicePdf(invoice);
  };

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

  const updateMenuPosition = useCallback((invoiceId) => {
    const button = menuButtonRefs.current[invoiceId];
    if (!button || typeof window === "undefined") return;

    const rect = button.getBoundingClientRect();
    const isSmallScreen = window.innerWidth < 640;
    const menuWidth = isSmallScreen ? Math.min(window.innerWidth - 32, 320) : 184;
    const estimatedHeight = 2 * 44 + 20;
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const shouldOpenUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const top = shouldOpenUpward
      ? Math.max(16, rect.top - Math.min(estimatedHeight, spaceAbove) - 8)
      : Math.min(window.innerHeight - estimatedHeight - 16, rect.bottom + 8);
    const maxHeight = Math.max(
      120,
      shouldOpenUpward ? spaceAbove - 8 : spaceBelow - 8
    );

    setMenuPosition({
      top,
      left: isSmallScreen
        ? Math.max(16, (window.innerWidth - menuWidth) / 2)
        : Math.min(
            Math.max(16, rect.right - menuWidth),
            Math.max(16, window.innerWidth - menuWidth - 16)
          ),
      width: menuWidth,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!activeMenuId) return undefined;

    function handleWindowChange() {
      updateMenuPosition(activeMenuId);
    }

    function handlePointerDown(event) {
      const button = menuButtonRefs.current[activeMenuId];
      if (button?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return;
      }

      setActiveMenuId("");
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActiveMenuId("");
      }
    }

    handleWindowChange();
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenuId, updateMenuPosition]);

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
                      ref={(node) => {
                        if (node) {
                          menuButtonRefs.current[invoice.id] = node;
                        } else {
                          delete menuButtonRefs.current[invoice.id];
                        }
                      }}
                      className="admin-btn admin-btn--ghost"
                      type="button"
                      onClick={() => {
                        if (activeMenuId === invoice.id) {
                          setActiveMenuId("");
                          return;
                        }
                        updateMenuPosition(invoice.id);
                        setActiveMenuId(invoice.id);
                      }}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMenuId ? (
          (() => {
            const activeInvoice = filteredInvoices.find((invoice) => invoice.id === activeMenuId);
            if (!activeInvoice) return null;

            return (
              <div
                ref={menuRef}
                className="fixed z-30 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  width: `${menuPosition.width}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                }}
              >
                <Link
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  href={`/dashboard/invoices/${activeInvoice.id}`}
                  onClick={() => setActiveMenuId("")}
                >
                  View
                </Link>
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  type="button"
                  onClick={async () => {
                    setActiveMenuId("");
                    try {
                      await handleDownload(activeInvoice);
                    } catch (downloadError) {
                      console.error(downloadError);
                      alert("Failed to download invoice PDF.");
                    }
                  }}
                >
                  Download
                </button>
              </div>
            );
          })()
        ) : null}

        {!loading && !filteredInvoices.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No invoices found. Invoices appear here after projects are marked completed.
          </p>
        ) : null}
      </section>
    </AdminLayout>
  );
}
