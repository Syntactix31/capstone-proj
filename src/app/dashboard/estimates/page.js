"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";
import {
  buildQuoteData,
  DEFAULT_DEPOSIT_RATE,
  DEFAULT_GST_RATE,
  formatCurrency,
  todayDateValue,
} from "../../lib/quotes.js";
import { SERVICE_CATALOG, normalizeServiceName } from "../../lib/services/catalog.js";
import {
  FIELD_LIMITS,
  inputPropsFor,
  sanitizeAlphaSpace,
  sanitizeEmail,
  sanitizeIntegerInput,
  sanitizeMoneyInput,
  sanitizePhone,
  sanitizePercentInput,
  sanitizeTextArea,
} from "../../lib/validation/fields.js";
import { downloadEstimatePdf } from "../../lib/estimates/pdf.js";

const DEFAULT_SERVICES = SERVICE_CATALOG.map((service, index) => ({
  id: `S-${String(index + 1).padStart(2, "0")}`,
  name: service.name,
  description: service.description,
  price: service.price,
  quantity: String(service.quantity),
  active: service.active,
}));

const STATUS_CLASS = {
  Pending: "admin-badge admin-badge--pending",
  Approved: "admin-badge admin-badge--active",
  Rejected: "admin-badge admin-badge--muted",
  "Quote requested": "admin-badge admin-badge--pending",
  "Converted to quote": "admin-badge admin-badge--active",
};

function createEstimateForm(service) {
  return {
    clientId: "custom",
    recipientName: "",
    recipientAddress: "",
    recipientEmail: "",
    recipientPhone: "",
    service: service?.name || DEFAULT_SERVICES[0].name,
    priceMode: "default",
    unitPrice: String(service?.price || "0.00"),
    quantity: String(service?.quantity || "1"),
    description: service?.description || "",
    sentDate: todayDateValue(),
    gstRate: String(DEFAULT_GST_RATE * 100),
    depositRate: String(DEFAULT_DEPOSIT_RATE * 100),
    notes: "",
  };
}

function createConvertForm(estimate) {
  const primaryService = Array.isArray(estimate?.servicesIncluded) ? estimate.servicesIncluded[0] : null;
  const quote = buildQuoteData(estimate?.quoteData || {}, {
    unitPrice: primaryService?.price || estimate?.total || "0.00",
    quantity: primaryService?.quantity || "1",
    description: primaryService?.description || "",
  });

  return {
    id: estimate?.id || "",
    recipientName: estimate?.recipientName || "",
    recipientAddress: estimate?.recipientAddress || "",
    recipientEmail: estimate?.recipientEmail || "",
    recipientPhone: estimate?.recipientPhone || "",
    service: estimate?.service || DEFAULT_SERVICES[0].name,
    priceMode: quote.priceMode === "default" ? "default" : "custom",
    unitPrice: String(quote.unitPrice || primaryService?.price || "0.00"),
    quantity: String(quote.quantity || primaryService?.quantity || "1"),
    description: quote.description || primaryService?.description || "",
    sentDate: quote.sentDate || todayDateValue(),
    gstRate: String(Number(quote.gstRate || DEFAULT_GST_RATE) * 100),
    depositRate: String(Number(quote.depositRate || DEFAULT_DEPOSIT_RATE) * 100),
    notes: estimate?.notes || "",
  };
}

function getEstimateStatusLabel(estimate) {
  if (estimate?.quoteConvertedAt) return "Converted to quote";
  if (estimate?.quoteRequestedAt) return "Quote requested";
  return estimate?.status || "Pending";
}

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [estimateForm, setEstimateForm] = useState(() =>
    createEstimateForm(DEFAULT_SERVICES[0])
  );
  const [convertForm, setConvertForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function refreshEstimates() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/estimates", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEstimates([]);
        setError(data?.error || "Failed to load estimates.");
        return;
      }

      setEstimates(Array.isArray(data.estimates) ? data.estimates : []);
    } catch (loadError) {
      console.error(loadError);
      setEstimates([]);
      setError("Failed to load estimates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshEstimates();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        const res = await fetch("/api/admin/services", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setServices(DEFAULT_SERVICES);
          return;
        }

        const nextServices = Array.isArray(data.services)
          ? data.services.map((service) => ({
              ...service,
              name: normalizeServiceName(service.name),
              quantity: String(service.quantity || 1),
            }))
          : [];
        setServices(nextServices.length ? nextServices : DEFAULT_SERVICES);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setServices(DEFAULT_SERVICES);
      }
    }

    loadServices();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setClientsLoading(true);
      try {
        const res = await fetch("/api/admin/clients", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setClients([]);
          setError((current) => current || data?.error || "Failed to load clients.");
          return;
        }

        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setClients([]);
        setError((current) => current || "Failed to load clients.");
      } finally {
        if (active) setClientsLoading(false);
      }
    }

    loadClients();
    return () => {
      active = false;
    };
  }, []);

  const availableServices = useMemo(
    () => services.filter((service) => service.active !== false),
    [services]
  );

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
          sensitivity: "base",
        })
      ),
    [clients]
  );

  const selectedService = useMemo(
    () =>
      availableServices.find((service) => service.name === estimateForm.service) ||
      availableServices[0] ||
      null,
    [availableServices, estimateForm.service]
  );

  const selectedConvertService = useMemo(
    () =>
      availableServices.find((service) => service.name === convertForm?.service) ||
      availableServices[0] ||
      null,
    [availableServices, convertForm?.service]
  );

  const selectedEditService = useMemo(
    () =>
      availableServices.find((service) => service.name === editForm?.service) ||
      availableServices[0] ||
      null,
    [availableServices, editForm?.service]
  );

  const estimateQuote = useMemo(
    () =>
      buildQuoteData({
        priceMode: estimateForm.priceMode,
        unitPrice: estimateForm.unitPrice,
        quantity: estimateForm.quantity,
        description: estimateForm.description,
        sentDate: estimateForm.sentDate,
        gstRate: estimateForm.gstRate,
        depositRate: estimateForm.depositRate,
      }),
    [
      estimateForm.depositRate,
      estimateForm.description,
      estimateForm.gstRate,
      estimateForm.priceMode,
      estimateForm.quantity,
      estimateForm.sentDate,
      estimateForm.unitPrice,
    ]
  );

  const serviceOptions = useMemo(
    () => ["All", ...Array.from(new Set(availableServices.map((service) => service.name))).sort()],
    [availableServices]
  );

  const convertQuote = useMemo(
    () =>
      buildQuoteData({
        priceMode: convertForm?.priceMode,
        unitPrice: convertForm?.unitPrice,
        quantity: convertForm?.quantity,
        description: convertForm?.description,
        sentDate: convertForm?.sentDate,
        gstRate: convertForm?.gstRate,
        depositRate: convertForm?.depositRate,
      }),
    [
      convertForm?.depositRate,
      convertForm?.description,
      convertForm?.gstRate,
      convertForm?.priceMode,
      convertForm?.quantity,
      convertForm?.sentDate,
      convertForm?.unitPrice,
    ]
  );

  const editQuote = useMemo(
    () =>
      buildQuoteData({
        priceMode: editForm?.priceMode,
        unitPrice: editForm?.unitPrice,
        quantity: editForm?.quantity,
        description: editForm?.description,
        sentDate: editForm?.sentDate,
        gstRate: editForm?.gstRate,
        depositRate: editForm?.depositRate,
      }),
    [
      editForm?.depositRate,
      editForm?.description,
      editForm?.gstRate,
      editForm?.priceMode,
      editForm?.quantity,
      editForm?.sentDate,
      editForm?.unitPrice,
    ]
  );

  const filteredEstimates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = estimates.filter((estimate) => {
      const matchesService =
        serviceFilter === "All" || normalizeServiceName(estimate.service) === serviceFilter;

      if (!normalizedQuery) return matchesService;

      const matchesQuery =
        String(estimate.recipientName || "").toLowerCase().includes(normalizedQuery) ||
        String(estimate.recipientEmail || "").toLowerCase().includes(normalizedQuery) ||
        String(estimate.recipientPhone || "").toLowerCase().includes(normalizedQuery) ||
        String(estimate.service || "").toLowerCase().includes(normalizedQuery) ||
        String(estimate.id || "").toLowerCase().includes(normalizedQuery);

      return matchesService && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date-asc" || sortBy === "date-desc") {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sortBy === "date-asc" ? aTime - bTime : bTime - aTime;
      }

      const aTotal = Number(a.total || 0);
      const bTotal = Number(b.total || 0);
      return sortBy === "total-asc" ? aTotal - bTotal : bTotal - aTotal;
    });
  }, [estimates, query, serviceFilter, sortBy]);

  const openEstimateModal = () => {
    const defaultService = availableServices[0] || DEFAULT_SERVICES[0];
    setEstimateForm(createEstimateForm(defaultService));
    setIsEstimateModalOpen(true);
  };

  const openConvertModal = (estimate) => {
    setConvertForm(createConvertForm(estimate));
    setActiveMenuId("");
  };

  const openEditModal = (estimate) => {
    setEditForm(createConvertForm(estimate));
    setActiveMenuId("");
  };

  const handleEstimateFormChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "recipientName") nextValue = sanitizeAlphaSpace(value, FIELD_LIMITS.name);
    if (name === "recipientAddress") nextValue = sanitizeTextArea(value, FIELD_LIMITS.address);
    if (name === "recipientEmail") nextValue = sanitizeEmail(value);
    if (name === "recipientPhone") nextValue = sanitizePhone(value);
    if (name === "quantity") nextValue = sanitizeIntegerInput(value);
    if (name === "unitPrice") nextValue = sanitizeMoneyInput(value);
    if (name === "gstRate" || name === "depositRate") nextValue = sanitizePercentInput(value);
    if (name === "description") nextValue = sanitizeTextArea(value, FIELD_LIMITS.description);
    if (name === "notes") nextValue = sanitizeTextArea(value, FIELD_LIMITS.notes);

    if (name === "service") {
      const nextService =
        availableServices.find((service) => service.name === value) || null;
      setEstimateForm((prev) => ({
        ...prev,
        service: value,
        unitPrice:
          prev.priceMode === "default"
            ? String(nextService?.price || "0.00")
            : prev.unitPrice,
        quantity: String(nextService?.quantity || prev.quantity || "1"),
        description:
          !prev.description || prev.description === selectedService?.description
            ? nextService?.description || ""
            : prev.description,
      }));
      return;
    }

    if (name === "clientId") {
      if (value === "custom") {
        setEstimateForm((prev) => ({
          ...prev,
          clientId: "custom",
          recipientName: "",
          recipientAddress: "",
          recipientEmail: "",
          recipientPhone: "",
        }));
        return;
      }

      const nextClient = sortedClients.find((client) => client.id === value) || null;
      setEstimateForm((prev) => ({
        ...prev,
        clientId: value,
        recipientName: nextClient?.name || "",
        recipientAddress: nextClient?.address || "",
        recipientEmail: nextClient?.email || "",
        recipientPhone: nextClient?.phone || "",
      }));
      return;
    }

    if (name === "priceMode") {
      setEstimateForm((prev) => ({
        ...prev,
        priceMode: value,
        unitPrice:
          value === "default"
            ? String(selectedService?.price || "0.00")
            : prev.unitPrice,
      }));
      return;
    }

    setEstimateForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleConvertFormChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "recipientName") nextValue = sanitizeAlphaSpace(value, FIELD_LIMITS.name);
    if (name === "recipientAddress") nextValue = sanitizeTextArea(value, FIELD_LIMITS.address);
    if (name === "recipientEmail") nextValue = sanitizeEmail(value);
    if (name === "recipientPhone") nextValue = sanitizePhone(value);
    if (name === "quantity") nextValue = sanitizeIntegerInput(value);
    if (name === "unitPrice") nextValue = sanitizeMoneyInput(value);
    if (name === "gstRate" || name === "depositRate") nextValue = sanitizePercentInput(value);
    if (name === "description") nextValue = sanitizeTextArea(value, FIELD_LIMITS.description);
    if (name === "notes") nextValue = sanitizeTextArea(value, FIELD_LIMITS.notes);

    if (name === "service") {
      const nextService = availableServices.find((service) => service.name === value) || null;
      setConvertForm((prev) => ({
        ...prev,
        service: value,
        unitPrice:
          prev.priceMode === "default"
            ? String(nextService?.price || "0.00")
            : prev.unitPrice,
        quantity: String(nextService?.quantity || prev.quantity || "1"),
        description:
          !prev.description || prev.description === selectedConvertService?.description
            ? nextService?.description || ""
            : prev.description,
      }));
      return;
    }

    if (name === "priceMode") {
      setConvertForm((prev) => ({
        ...prev,
        priceMode: value,
        unitPrice:
          value === "default"
            ? String(selectedConvertService?.price || "0.00")
            : prev.unitPrice,
      }));
      return;
    }

    setConvertForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "recipientName") nextValue = sanitizeAlphaSpace(value, FIELD_LIMITS.name);
    if (name === "recipientAddress") nextValue = sanitizeTextArea(value, FIELD_LIMITS.address);
    if (name === "recipientEmail") nextValue = sanitizeEmail(value);
    if (name === "recipientPhone") nextValue = sanitizePhone(value);
    if (name === "quantity") nextValue = sanitizeIntegerInput(value);
    if (name === "unitPrice") nextValue = sanitizeMoneyInput(value);
    if (name === "gstRate" || name === "depositRate") nextValue = sanitizePercentInput(value);
    if (name === "description") nextValue = sanitizeTextArea(value, FIELD_LIMITS.description);
    if (name === "notes") nextValue = sanitizeTextArea(value, FIELD_LIMITS.notes);

    if (name === "service") {
      const nextService = availableServices.find((service) => service.name === value) || null;
      setEditForm((prev) => ({
        ...prev,
        service: value,
        unitPrice:
          prev.priceMode === "default"
            ? String(nextService?.price || "0.00")
            : prev.unitPrice,
        quantity: String(nextService?.quantity || prev.quantity || "1"),
        description:
          !prev.description || prev.description === selectedEditService?.description
            ? nextService?.description || ""
            : prev.description,
      }));
      return;
    }

    if (name === "priceMode") {
      setEditForm((prev) => ({
        ...prev,
        priceMode: value,
        unitPrice:
          value === "default"
            ? String(selectedEditService?.price || "0.00")
            : prev.unitPrice,
      }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  async function handleEstimateCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/estimates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: estimateForm.clientId === "custom" ? "" : estimateForm.clientId,
          recipientName: estimateForm.recipientName,
          recipientAddress: estimateForm.recipientAddress,
          recipientEmail: estimateForm.recipientEmail,
          recipientPhone: estimateForm.recipientPhone,
          service: estimateForm.service,
          notes: estimateForm.notes,
          servicesIncluded: [
            {
              id: selectedService?.id || "service-1",
              name: estimateForm.service,
              description: estimateForm.description,
              price: estimateQuote.unitPrice,
              quantity: estimateQuote.quantity,
              total: estimateQuote.subtotal,
            },
          ],
          quoteData: estimateQuote,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to create estimate.");
        return;
      }

      const nextEstimateId = data?.estimate?.id;
      setIsEstimateModalOpen(false);
      await refreshEstimates();
      if (nextEstimateId && typeof window !== "undefined") {
        window.open(`/dashboard/estimates/${nextEstimateId}`, "_blank", "noopener,noreferrer");
      }
    } catch (createError) {
      console.error(createError);
      setError("Failed to create estimate.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEstimateConvert(event) {
    event.preventDefault();
    if (!convertForm?.id) return;

    setConverting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/estimates/${convertForm.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: convertForm.recipientName,
          recipientAddress: convertForm.recipientAddress,
          recipientEmail: convertForm.recipientEmail,
          recipientPhone: convertForm.recipientPhone,
          service: convertForm.service,
          notes: convertForm.notes,
          servicesIncluded: [
            {
              id: selectedConvertService?.id || "service-1",
              name: convertForm.service,
              description: convertForm.description,
              price: convertQuote.unitPrice,
              quantity: convertQuote.quantity,
              total: convertQuote.subtotal,
            },
          ],
          quoteData: convertQuote,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to convert estimate.");
        return;
      }

      const projectId = data?.project?.id;
      setConvertForm(null);
      await refreshEstimates();
      if (projectId && typeof window !== "undefined") {
        window.open(`/dashboard/projects/${projectId}/quote`, "_blank", "noopener,noreferrer");
      }
    } catch (convertError) {
      console.error(convertError);
      setError("Failed to convert estimate.");
    } finally {
      setConverting(false);
    }
  }

  async function handleEstimateUpdate(event) {
    event.preventDefault();
    if (!editForm?.id) return;

    setEditing(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/estimates/${editForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: editForm.recipientName,
          recipientAddress: editForm.recipientAddress,
          recipientEmail: editForm.recipientEmail,
          recipientPhone: editForm.recipientPhone,
          service: editForm.service,
          notes: editForm.notes,
          servicesIncluded: [
            {
              id: selectedEditService?.id || "service-1",
              name: editForm.service,
              description: editForm.description,
              price: editQuote.unitPrice,
              quantity: editQuote.quantity,
              total: editQuote.subtotal,
            },
          ],
          quoteData: editQuote,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to update estimate.");
        return;
      }

      setEditForm(null);
      await refreshEstimates();
    } catch (updateError) {
      console.error(updateError);
      setError("Failed to update estimate.");
    } finally {
      setEditing(false);
    }
  }

  async function handleEstimateDelete() {
    if (!deleteTarget?.id) return;

    setError("");
    try {
      const res = await fetch(`/api/admin/estimates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to delete estimate.");
        return;
      }

      setDeleteTarget(null);
      await refreshEstimates();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Failed to delete estimate.");
    }
  }

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Estimates</h1>
          <p className="admin-subtitle">
            Build standalone free estimates for potential clients using your service pricing and tax settings.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-projects-header">
          <h2 className="admin-card-title">Estimate list</h2>
          <button className="admin-btn admin-btn--primary" type="button" onClick={openEstimateModal}>
            New estimate
          </button>
        </div>

        <div className="admin-actions admin-projects-controls">
          <div className="admin-projects-control admin-projects-control--search">
            <input
              id="estimates-search"
              className="admin-input"
              type="search"
              placeholder="Search estimates..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search estimates"
            />
          </div>

          <div className="admin-projects-control">
            <label className="admin-projects-control-label" htmlFor="estimates-service-filter">
              Service
            </label>
            <select
              id="estimates-service-filter"
              className="admin-input"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              aria-label="Filter estimate service"
            >
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-projects-control">
            <label className="admin-projects-control-label" htmlFor="estimates-sort">
              Sort by
            </label>
            <select
              id="estimates-sort"
              className="admin-input"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort estimates"
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
            Loading estimates...
          </p>
        ) : !estimates.length ? (
          <p>No estimates found yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="grid items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:p-4 transition-colors duration-200 hover:bg-slate-50 grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr] sm:gap-4"
              >
                <div>
                  <div className="font-semibold text-slate-900">{estimate.recipientName}</div>
                  <div className="text-sm text-slate-500">{estimate.service}</div>
                  <div className="text-xs text-slate-400">
                    Estimate #{estimate.id.slice(0, 8)} · {estimate.recipientEmail || "No email"}
                  </div>
                </div>

                <div className="justify-self-start sm:justify-self-end sm:text-right">
                  <div className="text-slate-900 font-semibold">{formatCurrency(estimate.total)}</div>
                  <div className="text-xs text-slate-500">
                    GST {formatCurrency(estimate.gstAmount)}
                  </div>
                </div>

                <div className="justify-self-start sm:justify-self-end">
                  <span className={STATUS_CLASS[getEstimateStatusLabel(estimate)] || "admin-badge admin-badge--muted"}>
                    {getEstimateStatusLabel(estimate)}
                  </span>
                </div>

                <div className="flex flex-wrap justify-start sm:justify-end items-center gap-2 sm:gap-3">
                  {estimate.quoteRequestedAt && !estimate.quoteConvertedAt ? (
                    <button
                      className="admin-btn admin-btn--ghost"
                      type="button"
                      onClick={() => openConvertModal(estimate)}
                    >
                      Convert to quote
                    </button>
                  ) : null}
                  <div className="relative">
                    <button
                      className="admin-btn admin-btn--ghost"
                      type="button"
                      onClick={() =>
                        setActiveMenuId((current) => (current === estimate.id ? "" : estimate.id))
                      }
                    >
                      Manage
                    </button>
                    {activeMenuId === estimate.id ? (
                      <div className="absolute right-0 top-full z-20 mt-2 min-w-[160px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        <Link
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          href={
                            estimate.quoteConvertedAt && estimate.convertedProjectId
                              ? `/dashboard/projects/${estimate.convertedProjectId}/quote`
                              : `/dashboard/estimates/${estimate.id}`
                          }
                          target="_blank"
                          onClick={() => setActiveMenuId("")}
                        >
                          View
                        </Link>
                        <button
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          type="button"
                          onClick={() => openEditModal(estimate)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          type="button"
                          onClick={async () => {
                            setActiveMenuId("");
                            try {
                              await downloadEstimatePdf(estimate);
                            } catch (downloadError) {
                              console.error(downloadError);
                              alert("Failed to download estimate PDF.");
                            }
                          }}
                        >
                          Download
                        </button>
                        <button
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                          type="button"
                          onClick={() => {
                            setDeleteTarget(estimate);
                            setActiveMenuId("");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && estimates.length > 0 && !filteredEstimates.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No estimates match current filters.
          </p>
        ) : null}
      </section>

      {isEstimateModalOpen ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close estimate modal"
            onClick={() => setIsEstimateModalOpen(false)}
          />
          <form className="admin-modal__content" role="dialog" aria-modal="true" onSubmit={handleEstimateCreate}>
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">New estimate</h2>
                <p className="admin-subtitle">
                  Create a free estimate for a potential client using service defaults or custom pricing.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => setIsEstimateModalOpen(false)}
                disabled={saving}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-client-id">
                  Recipient source
                </label>
                <select
                  id="estimate-client-id"
                  name="clientId"
                  className="admin-input"
                  value={estimateForm.clientId}
                  onChange={handleEstimateFormChange}
                  disabled={clientsLoading}
                >
                  <option value="custom">Custom recipient</option>
                  {sortedClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.email ? `(${client.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-recipient-name">
                  Recipient full name
                </label>
                <input
                  id="estimate-recipient-name"
                  name="recipientName"
                  {...inputPropsFor("name")}
                  className="admin-input"
                  value={estimateForm.recipientName}
                  onChange={handleEstimateFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="estimate-recipient-email">
                  Email
                </label>
                <input
                  id="estimate-recipient-email"
                  name="recipientEmail"
                  type="email"
                  {...inputPropsFor("email")}
                  className="admin-input"
                  value={estimateForm.recipientEmail}
                  onChange={handleEstimateFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="estimate-recipient-phone">
                  Phone
                </label>
                <input
                  id="estimate-recipient-phone"
                  name="recipientPhone"
                  {...inputPropsFor("phone")}
                  className="admin-input"
                  value={estimateForm.recipientPhone}
                  onChange={handleEstimateFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-recipient-address">
                  Address
                </label>
                <input
                  id="estimate-recipient-address"
                  name="recipientAddress"
                  {...inputPropsFor("address")}
                  className="admin-input"
                  value={estimateForm.recipientAddress}
                  onChange={handleEstimateFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-service">
                  Service
                </label>
                <select
                  id="estimate-service"
                  name="service"
                  className="admin-input"
                  value={estimateForm.service}
                  onChange={handleEstimateFormChange}
                  required
                >
                  {availableServices.map((service) => (
                    <option key={service.id || service.name} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-quantity">
                  Quantity
                </label>
                <input
                  id="estimate-quantity"
                  name="quantity"
                  {...inputPropsFor("quantity")}
                  className="admin-input"
                  type="number"
                  min="1"
                  step="1"
                  value={estimateForm.quantity}
                  onChange={handleEstimateFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-price-mode">
                  Pricing mode
                </label>
                <select
                  id="estimate-price-mode"
                  name="priceMode"
                  className="admin-input"
                  value={estimateForm.priceMode}
                  onChange={handleEstimateFormChange}
                >
                  <option value="default">Use default service price</option>
                  <option value="custom">Use custom unit price</option>
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-unit-price">
                  Unit price ($)
                </label>
                <input
                  id="estimate-unit-price"
                  name="unitPrice"
                  {...inputPropsFor("money")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimateForm.unitPrice}
                  onChange={handleEstimateFormChange}
                  disabled={estimateForm.priceMode === "default"}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-sent-date">
                  Estimate date
                </label>
                <input
                  id="estimate-sent-date"
                  name="sentDate"
                  className="admin-input"
                  type="date"
                  value={estimateForm.sentDate}
                  onChange={handleEstimateFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-gst-rate">
                  GST (%)
                </label>
                <input
                  id="estimate-gst-rate"
                  name="gstRate"
                  {...inputPropsFor("percent")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={estimateForm.gstRate}
                  onChange={handleEstimateFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-deposit-rate">
                  Deposit required (%)
                </label>
                <input
                  id="estimate-deposit-rate"
                  name="depositRate"
                  {...inputPropsFor("percent")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={estimateForm.depositRate}
                  onChange={handleEstimateFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-description">
                  Service description
                </label>
                <textarea
                  id="estimate-description"
                  name="description"
                  maxLength={FIELD_LIMITS.description}
                  className="admin-textarea"
                  rows={5}
                  value={estimateForm.description}
                  onChange={handleEstimateFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="estimate-notes">
                  Notes
                </label>
                <textarea
                  id="estimate-notes"
                  name="notes"
                  maxLength={FIELD_LIMITS.notes}
                  className="admin-textarea"
                  rows={4}
                  value={estimateForm.notes}
                  onChange={handleEstimateFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Estimate subtotal</label>
                <input className="admin-input" value={formatCurrency(estimateQuote.subtotal)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">GST amount</label>
                <input className="admin-input" value={formatCurrency(estimateQuote.gstAmount)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Deposit amount</label>
                <input className="admin-input" value={formatCurrency(estimateQuote.depositAmount)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Estimate total</label>
                <input className="admin-input" value={formatCurrency(estimateQuote.total)} disabled readOnly />
              </div>
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create estimate"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setIsEstimateModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {convertForm ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close convert quote modal"
            onClick={() => setConvertForm(null)}
          />
          <form className="admin-modal__content" role="dialog" aria-modal="true" onSubmit={handleEstimateConvert}>
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">Convert to quote</h2>
                <p className="admin-subtitle">
                  Finalize recipient details and pricing, then create a project quote from this estimate.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => setConvertForm(null)}
                disabled={converting}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-recipient-name">
                  Recipient full name
                </label>
                <input
                  id="convert-recipient-name"
                  name="recipientName"
                  {...inputPropsFor("name")}
                  className="admin-input"
                  value={convertForm.recipientName}
                  onChange={handleConvertFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="convert-recipient-email">
                  Email
                </label>
                <input
                  id="convert-recipient-email"
                  name="recipientEmail"
                  type="email"
                  {...inputPropsFor("email")}
                  className="admin-input"
                  value={convertForm.recipientEmail}
                  onChange={handleConvertFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="convert-recipient-phone">
                  Phone
                </label>
                <input
                  id="convert-recipient-phone"
                  name="recipientPhone"
                  {...inputPropsFor("phone")}
                  className="admin-input"
                  value={convertForm.recipientPhone}
                  onChange={handleConvertFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-recipient-address">
                  Address
                </label>
                <input
                  id="convert-recipient-address"
                  name="recipientAddress"
                  {...inputPropsFor("address")}
                  className="admin-input"
                  value={convertForm.recipientAddress}
                  onChange={handleConvertFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-service">
                  Service
                </label>
                <select
                  id="convert-service"
                  name="service"
                  className="admin-input"
                  value={convertForm.service}
                  onChange={handleConvertFormChange}
                  required
                >
                  {availableServices.map((service) => (
                    <option key={service.id || service.name} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-quantity">
                  Quantity
                </label>
                <input
                  id="convert-quantity"
                  name="quantity"
                  {...inputPropsFor("quantity")}
                  className="admin-input"
                  type="number"
                  min="1"
                  step="1"
                  value={convertForm.quantity}
                  onChange={handleConvertFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-price-mode">
                  Pricing mode
                </label>
                <select
                  id="convert-price-mode"
                  name="priceMode"
                  className="admin-input"
                  value={convertForm.priceMode}
                  onChange={handleConvertFormChange}
                >
                  <option value="default">Use default service price</option>
                  <option value="custom">Use custom unit price</option>
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-unit-price">
                  Unit price ($)
                </label>
                <input
                  id="convert-unit-price"
                  name="unitPrice"
                  {...inputPropsFor("money")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={convertForm.unitPrice}
                  onChange={handleConvertFormChange}
                  disabled={convertForm.priceMode === "default"}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-sent-date">
                  Quote date
                </label>
                <input
                  id="convert-sent-date"
                  name="sentDate"
                  className="admin-input"
                  type="date"
                  value={convertForm.sentDate}
                  onChange={handleConvertFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-gst-rate">
                  GST (%)
                </label>
                <input
                  id="convert-gst-rate"
                  name="gstRate"
                  {...inputPropsFor("percent")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={convertForm.gstRate}
                  onChange={handleConvertFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-deposit-rate">
                  Deposit required (%)
                </label>
                <input
                  id="convert-deposit-rate"
                  name="depositRate"
                  {...inputPropsFor("percent")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={convertForm.depositRate}
                  onChange={handleConvertFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-description">
                  Service description
                </label>
                <textarea
                  id="convert-description"
                  name="description"
                  maxLength={FIELD_LIMITS.description}
                  className="admin-textarea"
                  rows={5}
                  value={convertForm.description}
                  onChange={handleConvertFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="convert-notes">
                  Notes
                </label>
                <textarea
                  id="convert-notes"
                  name="notes"
                  maxLength={FIELD_LIMITS.notes}
                  className="admin-textarea"
                  rows={4}
                  value={convertForm.notes}
                  onChange={handleConvertFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Quote subtotal</label>
                <input className="admin-input" value={formatCurrency(convertQuote.subtotal)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">GST amount</label>
                <input className="admin-input" value={formatCurrency(convertQuote.gstAmount)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Deposit amount</label>
                <input className="admin-input" value={formatCurrency(convertQuote.depositAmount)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Quote total</label>
                <input className="admin-input" value={formatCurrency(convertQuote.total)} disabled readOnly />
              </div>
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--primary" type="submit" disabled={converting}>
                {converting ? "Converting..." : "Finalize and create quote"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setConvertForm(null)}
                disabled={converting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {editForm ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close edit estimate modal"
            onClick={() => setEditForm(null)}
          />
          <form className="admin-modal__content" role="dialog" aria-modal="true" onSubmit={handleEstimateUpdate}>
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">
                  {editForm.id && estimates.find((estimate) => estimate.id === editForm.id)?.quoteConvertedAt
                    ? "Edit quote"
                    : "Edit estimate"}
                </h2>
                <p className="admin-subtitle">
                  Update recipient details and pricing from the estimates dashboard.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => setEditForm(null)}
                disabled={editing}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-recipient-name">
                  Recipient full name
                </label>
                <input
                  id="edit-recipient-name"
                  name="recipientName"
                  {...inputPropsFor("name")}
                  className="admin-input"
                  value={editForm.recipientName}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="edit-recipient-email">
                  Email
                </label>
                <input
                  id="edit-recipient-email"
                  name="recipientEmail"
                  type="email"
                  {...inputPropsFor("email")}
                  className="admin-input"
                  value={editForm.recipientEmail}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="edit-recipient-phone">
                  Phone
                </label>
                <input
                  id="edit-recipient-phone"
                  name="recipientPhone"
                  {...inputPropsFor("phone")}
                  className="admin-input"
                  value={editForm.recipientPhone}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-recipient-address">
                  Address
                </label>
                <input
                  id="edit-recipient-address"
                  name="recipientAddress"
                  {...inputPropsFor("address")}
                  className="admin-input"
                  value={editForm.recipientAddress}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-service">
                  Service
                </label>
                <select
                  id="edit-service"
                  name="service"
                  className="admin-input"
                  value={editForm.service}
                  onChange={handleEditFormChange}
                  required
                >
                  {availableServices.map((service) => (
                    <option key={service.id || service.name} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-quantity">
                  Quantity
                </label>
                <input
                  id="edit-quantity"
                  name="quantity"
                  {...inputPropsFor("quantity")}
                  className="admin-input"
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.quantity}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-price-mode">
                  Pricing mode
                </label>
                <select
                  id="edit-price-mode"
                  name="priceMode"
                  className="admin-input"
                  value={editForm.priceMode}
                  onChange={handleEditFormChange}
                >
                  <option value="default">Use default service price</option>
                  <option value="custom">Use custom unit price</option>
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-unit-price">
                  Unit price ($)
                </label>
                <input
                  id="edit-unit-price"
                  name="unitPrice"
                  {...inputPropsFor("money")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.unitPrice}
                  onChange={handleEditFormChange}
                  disabled={editForm.priceMode === "default"}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-sent-date">
                  Quote date
                </label>
                <input
                  id="edit-sent-date"
                  name="sentDate"
                  className="admin-input"
                  type="date"
                  value={editForm.sentDate}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-gst-rate">
                  GST (%)
                </label>
                <input
                  id="edit-gst-rate"
                  name="gstRate"
                  {...inputPropsFor("percent")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm.gstRate}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-deposit-rate">
                  Deposit required (%)
                </label>
                <input
                  id="edit-deposit-rate"
                  name="depositRate"
                  {...inputPropsFor("percent")}
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm.depositRate}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-description">
                  Service description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  maxLength={FIELD_LIMITS.description}
                  className="admin-textarea"
                  rows={5}
                  value={editForm.description}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="edit-notes">
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  maxLength={FIELD_LIMITS.notes}
                  className="admin-textarea"
                  rows={4}
                  value={editForm.notes}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Subtotal</label>
                <input className="admin-input" value={formatCurrency(editQuote.subtotal)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">GST amount</label>
                <input className="admin-input" value={formatCurrency(editQuote.gstAmount)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Deposit amount</label>
                <input className="admin-input" value={formatCurrency(editQuote.depositAmount)} disabled readOnly />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Total</label>
                <input className="admin-input" value={formatCurrency(editQuote.total)} disabled readOnly />
              </div>
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--primary" type="submit" disabled={editing}>
                {editing ? "Saving..." : "Save changes"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setEditForm(null)}
                disabled={editing}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close delete estimate confirmation"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="admin-modal__content" role="alertdialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">Delete estimate</h2>
                <p className="admin-subtitle">
                  This will permanently remove this estimate record. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="admin-form">
              <div className="admin-field">
                <span className="admin-label">Recipient</span>
                <div className="admin-muted">{deleteTarget.recipientName || "Unknown recipient"}</div>
              </div>
              <div className="admin-field">
                <span className="admin-label">Service</span>
                <div className="admin-muted">{deleteTarget.service || "No service"}</div>
              </div>
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--danger" type="button" onClick={handleEstimateDelete}>
                Delete estimate
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
