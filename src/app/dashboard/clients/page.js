"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout.js";

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const EMAIL_PATTERN = String.raw`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`;
  const isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").toLowerCase().trim());
  const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
  const isValidPhone = (value) => /^\d{10}$/.test(normalizePhone(value));
  const formatPhoneDisplay = (value) => {
    const digits = normalizePhone(value);
    if (digits.length !== 10) return value || "";
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const phoneDisplayValue = !draft
    ? ""
    : phoneFocused
      ? draft.phone
      : isValidPhone(draft.phone)
        ? formatPhoneDisplay(draft.phone)
        : draft.phone;

  const canSave =
    Boolean(draft?.name?.trim()) &&
    isValidEmail(draft?.email) &&
    isValidPhone(draft?.phone);

  const handleSave = async () => {
    if (!canSave) return;
    if (!draft?.id) return;

    setBusy(true);
    setError("");
    const normalizedDraft = {
      ...draft,
      phone: normalizePhone(draft.phone),
    };

    try {
      const res = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedDraft),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to save client.");
        return;
      }

      setClients((prev) =>
        prev.map((client) =>
          client.id === data.client.id ? data.client : client
        )
      );
      setDraft(data.client);
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save client.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
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
          <button className="admin-btn admin-btn--primary" type="button" disabled>
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
                onClick={() => setSelectedId(client.id)}
              >
                <div className="admin-client-avatar">
                  {client.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="admin-client-body">
                  <div className="admin-client-name">{client.name}</div>
                  <div className="admin-muted">{client.email}</div>
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
                  {draft.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="admin-client-title">{draft.name}</h2>
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
                    disabled={!canSave || busy}
                    title={canSave ? "Save changes" : "Fix name, email, and phone to save."}
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
                  <button className="admin-btn admin-btn--ghost admin-btn--small" type="button" disabled>
                    New property
                  </button>
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
                      value={draft.postal}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, postal: event.target.value }))
                      }
                    />
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
