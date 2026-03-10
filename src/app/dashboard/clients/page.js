"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout.js";

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [lastAddAt, setLastAddAt] = useState(0);
  const [lastSwitchWarnAt, setLastSwitchWarnAt] = useState(0);
  const [lastSaveWarnAt, setLastSaveWarnAt] = useState(0);
  const [pendingClientId, setPendingClientId] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId) || clients[0] || null,
    [clients, selectedId]
  );
  const [draft, setDraft] = useState(null);
  const [phoneFocused, setPhoneFocused] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadClients() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/clients", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok) {
          setClients([]);
          setError(data?.error || "Failed to load clients.");
          return;
        }

        const nextClients = Array.isArray(data.clients) ? data.clients : [];
        setClients(nextClients);
        setSelectedId((current) => current || (nextClients[0]?.id ?? null));
      } catch (fetchError) {
        console.error(fetchError);
        if (!alive) return;
        setClients([]);
        setError("Failed to load clients.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadClients();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setDraft(selectedClient);
    setPhoneFocused(false);
  }, [selectedClient]);

  const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
  const normalizePostal = (value) =>
    String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const EMAIL_PATTERN = String.raw`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`;
  const isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").toLowerCase().trim());
  const isValidPhone = (value) => /^\d{10}$/.test(normalizePhone(value));
  const isValidPostal = (value) => /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalizePostal(value));
  const formatPostalDisplay = (value) => {
    const raw = normalizePostal(value);
    if (!raw) return "";
    const head = raw.slice(0, 3);
    const tail = raw.slice(3);
    return tail ? `${head} ${tail}` : head;
  };
  const formatPhoneDisplay = (value) => {
    const digits = normalizePhone(value);
    if (digits.length !== 10) return "";
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const phoneDisplayValue = !draft
    ? ""
    : phoneFocused
      ? draft.phone
      : isValidPhone(draft.phone)
        ? formatPhoneDisplay(draft.phone)
        : draft.phone;

  const postalDisplayValue = !draft ? "" : formatPostalDisplay(draft.postal);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !selectedClient) return false;
    return (
      String(draft.name || "") !== String(selectedClient.name || "") ||
      String(draft.email || "") !== String(selectedClient.email || "") ||
      normalizePhone(draft.phone) !== normalizePhone(selectedClient.phone) ||
      String(draft.address || "") !== String(selectedClient.address || "") ||
      String(draft.city || "") !== String(selectedClient.city || "") ||
      String(draft.province || "") !== String(selectedClient.province || "") ||
      normalizePostal(draft.postal) !== normalizePostal(selectedClient.postal) ||
      String(draft.propertyType || "") !== String(selectedClient.propertyType || "") ||
      String(draft.notes || "") !== String(selectedClient.notes || "") ||
      String(draft.additionalInstructions || "") !== String(selectedClient.additionalInstructions || "")
    );
  }, [draft, selectedClient]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleLinkClick = (event) => {
      const target = event.target.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (href === "/dashboard/clients") return;
      if (target.getAttribute("target") === "_blank") return;
      const ok = window.confirm("You have unsaved changes. Leave this page?");
      if (!ok) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [hasUnsavedChanges]);

  const canSave =
    Boolean(draft?.name?.trim()) &&
    isValidEmail(draft?.email) &&
    isValidPhone(draft?.phone) &&
    Boolean(draft?.address?.trim()) &&
    isValidPostal(draft?.postal) &&
    Boolean(draft?.propertyType?.trim());

  const canAddClient = !draft || canSave;

  const isDraftEmpty = (client) => {
    if (!client) return true;
    const name = String(client.name || "").trim();
    const email = String(client.email || "").trim();
    const phone = normalizePhone(client.phone || "");
    const address = String(client.address || "").trim();
    const postal = String(client.postal || "").trim();
    const notes = String(client.notes || "").trim();
    const extra = String(client.additionalInstructions || "").trim();
    return !name && !email && !phone && !address && !postal && !notes && !extra;
  };

  const removeEmptyDraftIfNeeded = () => {
    if (!draft?.id) return;
    if (hasUnsavedChanges) return;
    if (!isDraftEmpty(draft)) return;
    setClients((prev) => prev.filter((client) => client.id !== draft.id));
  };

  const nextClientId = (items) => {
    const maxNum = items.reduce((max, client) => {
      const match = String(client.id || "").match(/^C-(\d+)$/);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);
    return `C-${String(maxNum + 1).padStart(4, "0")}`;
  };

  const handleSave = async () => {
    if (!canSave) {
      const now = Date.now();
      if (now - lastSaveWarnAt < 1000) return false;
      setLastSaveWarnAt(now);
      setAlertMessage("Please complete all required fields before saving.");
      setTimeout(() => setAlertMessage(""), 2800);
      return false;
    }
    if (!draft?.id) return false;
    if (busy) return false;

    setBusy(true);
    setError("");

    const normalizedDraft = {
      ...draft,
      phone: normalizePhone(draft.phone),
    };

    const payload = { ...normalizedDraft };
    delete payload._isNew;
    if (draft._isNew) {
      delete payload.id;
    }

    try {
      const res = await fetch("/api/admin/clients", {
        method: draft._isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to save client.");
        return false;
      }

      setClients((prev) =>
        prev.map((client) =>
          client.id === draft.id ? data.client : client
        )
      );
      setDraft(data.client);
      setSelectedId(data.client.id);
      return true;
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save client.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAddClient = () => {
    const now = Date.now();
    if (now - lastAddAt < 1000) return;
    setLastAddAt(now);
    if (!canAddClient) {
      setAlertMessage("You have a new client form in progress. Please complete it before adding another.");
      setTimeout(() => setAlertMessage(""), 2800);
      return;
    }
    if (hasUnsavedChanges) {
      setPendingClientId("__new__");
      setShowUnsavedModal(true);
      return;
    }
    const newClient = {
      id: nextClientId(clients),
      _isNew: true,
      name: "",
      email: "",
      phone: "",
      city: "Calgary",
      province: "Alberta",
      address: "",
      postal: "",
      propertyType: "House",
      notes: "",
      additionalInstructions: "",
    };
    setClients((prev) => [newClient, ...prev]);
    setSelectedId(newClient.id);
    setDraft(newClient);
  };

  const handleSelectClient = (clientId) => {
    if (clientId === selectedId) return;
    if (hasUnsavedChanges) {
      const now = Date.now();
      if (now - lastSwitchWarnAt < 1000) return;
      setLastSwitchWarnAt(now);
      setPendingClientId(clientId);
      setShowUnsavedModal(true);
      return;
    }
    removeEmptyDraftIfNeeded();
    setSelectedId(clientId);
  };

  return (
    <AdminLayout>
      {alertMessage ? (
        <div className="admin-toast" role="status" aria-live="polite">
          {alertMessage}
        </div>
      ) : null}
      {showUnsavedModal ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close unsaved changes modal"
            onClick={() => {
              setShowUnsavedModal(false);
              setPendingClientId(null);
            }}
          />
          <div className="admin-modal__content admin-modal__content--compact" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Unsaved changes</p>
                <h2 className="admin-title">You have unsaved changes.</h2>
              </div>
            </div>
            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  setPendingClientId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn--danger"
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  if (pendingClientId) {
                    if (selectedClient?._isNew) {
                      setClients((prev) => prev.filter((client) => client.id !== selectedClient.id));
                    }
                    if (pendingClientId === "__new__") {
                      const newClient = {
                        id: nextClientId(clients),
                        _isNew: true,
                        name: "",
                        email: "",
                        phone: "",
                        city: "Calgary",
                        province: "Alberta",
                        address: "",
                        postal: "",
                        propertyType: "House",
                        notes: "",
                        additionalInstructions: "",
                      };
                      setClients((prev) => [newClient, ...prev]);
                      setSelectedId(newClient.id);
                      setDraft(newClient);
                    } else {
                      setSelectedId(pendingClientId);
                    }
                  }
                  setPendingClientId(null);
                }}
              >
                Don't save
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Clients</p>
          <h1 className="admin-title">Client Management</h1>
          <p className="admin-subtitle">
            Manage client details, properties, and communication preferences.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-hero-actions">
          <button
            className="admin-btn admin-btn--primary"
            type="button"
            onClick={handleAddClient}
            title="Add client"
          >
            Add client
          </button>
        </div>
      </section>

      <section className="admin-client-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Clients</h2>
            <span className="admin-muted">{clients.length} total</span>
          </div>

          <div className="admin-client-list">
            {loading ? <p className="admin-muted">Loading clients...</p> : null}
            {!loading && !clients.length ? (
              <p className="admin-muted">No clients yet. New bookings create client records automatically.</p>
            ) : null}
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                className={`admin-client-item ${
                  client.id === selectedId ? "is-active" : ""
                }`}
                onClick={() => handleSelectClient(client.id)}
              >
                <div className="admin-client-avatar">
                  {String(client.name || "")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="admin-client-body">
                  <div className="admin-client-name">{client.name || "New client"}</div>
                  <div className="admin-muted">{client.email || "No email yet"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-card">
          {!draft ? (
            <p className="admin-muted">Select a client to view details.</p>
          ) : (
            <>
              <div className="admin-client-header">
                <div className="admin-client-avatar admin-client-avatar--large">
                  {String(draft.name || "")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="admin-client-title">{draft.name || "New client"}</h2>
                  <div className="admin-client-sub">{draft.id}</div>
                </div>
              </div>

              <div className="admin-section">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Client details</h3>
                  <button
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    type="button"
                    onClick={handleSave}
                    disabled={busy}
                    title={canSave ? "Save changes" : "Complete required fields to save."}
                  >
                    {busy ? "Saving..." : "Save changes"}
                  </button>
                </div>
                <div className="admin-form">
                  <label className="admin-field">
                    <span className="admin-label">Full name</span>
                    <input
                      className="admin-input"
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Email</span>
                    <input
                      className="admin-input"
                      type="email"
                      pattern={EMAIL_PATTERN}
                      title="Use a valid email like name@example.com."
                      value={draft.email}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                    {draft.email && !isValidEmail(draft.email) ? (
                      <p className="admin-error">Enter a valid email like name@example.com.</p>
                    ) : null}
                  </label>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="clientPhone">
                      Phone
                    </label>
                    <input
                      id="clientPhone"
                      className="admin-input"
                      type="tel"
                      inputMode="tel"
                      pattern="^\\d{10}$"
                      title="Enter 10 digits, e.g. 5875550142"
                      value={phoneDisplayValue}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      onChange={(event) => {
                        const digits = normalizePhone(event.target.value);
                        setDraft((current) => ({ ...current, phone: digits }));
                      }}
                    />
                    {draft.phone && !isValidPhone(draft.phone) ? (
                      <p className="admin-error">Enter a 10-digit phone number.</p>
                    ) : null}
                  </div>
                  <label className="admin-field">
                    <span className="admin-label">Notes</span>
                    <textarea
                      className="admin-textarea"
                      placeholder="Add notes about the client..."
                      rows={4}
                      value={draft.notes}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="admin-section">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Property details</h3>
                </div>
                <div className="admin-form">
                  <label className="admin-field admin-field--full">
                    <span className="admin-label">Street address</span>
                    <input
                      className="admin-input"
                      value={draft.address}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">City</span>
                    <input
                      className="admin-input"
                      value={draft.city}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, city: event.target.value }))
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Province</span>
                    <input
                      className="admin-input"
                      value={draft.province}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, province: event.target.value }))
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Postal code</span>
                    <input
                      className="admin-input"
                      value={postalDisplayValue}
                      pattern="^[A-Za-z]\\d[A-Za-z]\\s?\\d[A-Za-z]\\d$"
                      title="Use format X1X 1X1"
                      onChange={(event) => {
                        const normalized = normalizePostal(event.target.value);
                        setDraft((current) => ({ ...current, postal: normalized }));
                      }}
                    />
                    {draft.postal && !isValidPostal(draft.postal) ? (
                      <p className="admin-error">Use format X1X 1X1.</p>
                    ) : null}
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Property type</span>
                    <select
                      className="admin-input"
                      value={draft.propertyType}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, propertyType: event.target.value }))
                      }
                    >
                      <option>House</option>
                      <option>Townhome</option>
                      <option>Condo</option>
                      <option>Commercial</option>
                    </select>
                  </label>
                  <label className="admin-field admin-field--full">
                    <span className="admin-label">Additional instructions</span>
                    <textarea
                      className="admin-textarea"
                      placeholder="Gate codes, access notes, or special requests."
                      rows={3}
                      value={draft.additionalInstructions}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          additionalInstructions: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
