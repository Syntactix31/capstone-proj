"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout.js";

const CLIENT_FIELD_LIMITS = {
  name: 30,
  email: 120,
  address: 120,
  city: 60,
  province: 60,
  notes: 1000,
  additionalInstructions: 1000,
};

// Admin page for viewing, editing, and creating client records.
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
  const [deleteTarget, setDeleteTarget] = useState(null);

  /*  Theo
  - Look through clients
  - Find the client whose id matches selectedId
  - If none is found, use the first client in the array
  - If there is no first client, use null
  */
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId) || clients[0] || null,
    [clients, selectedId]
  );
  const [draft, setDraft] = useState(null);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const cloneClientDraft = (client) =>
    client
      ? {
          ...client,
        }
      : null;

  // Implemented by jiro
  // Load client records from the protected admin route.
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

  /* Theo
  when we switch clients, we replace the current form
  contents with the selected client's data

  Phone number field is formatted when not focused so we establish
  that the phone number field isn't in focus
  */
  useEffect(() => {
    setDraft(cloneClientDraft(selectedClient));
    setPhoneFocused(false);
  }, [selectedClient]);

    /*Field formatting + input rules

  */
  const normalizePhone = (value) => String(value || "").replace(/\D/g, ""); // takes the value or empty, '\D' replaces all non digit chars
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/; // valid email pattern rules
  const EMAIL_PATTERN = String.raw`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`; // string format
  const isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").toLowerCase().trim()); // tests the input if it matches the email pattern
  const isValidPhone = (value) => /^\d{10}$/.test(normalizePhone(value)); // digits only must equal to 10
  /*
  Ensures that the phone number is exactly 10 digits and if it isn't then string is returned empty
  then phone number formatting (xxx)-xxx-xxxx
  */
  const formatPhoneDisplay = (value) => {
    const digits = normalizePhone(value);
    if (digits.length !== 10) return "";
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  /*
  checks if there is a draft for the phone input field
  if not then it should return empty
  checks if input field is focused
  if it is then phonedisplayvalue will = the draft state of the phone field
  also formats the phone display text when field isn't in focus
  */
  const phoneDisplayValue = !draft
    ? ""
    : phoneFocused
      ? draft.phone
      : isValidPhone(draft.phone)
        ? formatPhoneDisplay(draft.phone)
        : draft.phone;

/*
Checks the client forms if there is any unsaved changes
checks if input draft isn't equal to the selectedClient's saved info
hasUnsavedChange becomes true if ^^ is true
*/
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !selectedClient) return false; // if either value is null then hasUnsavedChanges returns false
    return (
      String(draft.name || "") !== String(selectedClient.name || "") ||
      String(draft.email || "") !== String(selectedClient.email || "") ||
      normalizePhone(draft.phone) !== normalizePhone(selectedClient.phone) || // removes the formatting before checking
      String(draft.address || "") !== String(selectedClient.address || "") ||
      String(draft.city || "") !== String(selectedClient.city || "") ||
      String(draft.province || "") !== String(selectedClient.province || "") ||
      String(draft.propertyType || "") !== String(selectedClient.propertyType || "") ||
      String(draft.notes || "") !== String(selectedClient.notes || "") ||
      String(draft.additionalInstructions || "") !== String(selectedClient.additionalInstructions || "")
    );
  }, [draft, selectedClient]);

  useEffect(() => {
    if (!hasUnsavedChanges) return; // if there aren't unsaved changes then function exits

    const handleBeforeUnload = (event) => {
      event.preventDefault(); // prevents the browser from immediately leaving
      event.returnValue = ""; // browser confirmation pop up
    };

    /*
    handles the interaction of links inside the page

    FIX:
    need to prevent button navigations like logging out
    */
    const handleLinkClick = (event) => {
      const target = event.target.closest("a"); // detects an element is clicked. "a" because next.js renders <Link> as <a> in the DOM
      if (!target) return; // ignores interaction if it wasn't a link
      const href = target.getAttribute("href"); // gets the link destination
      if (!href || href.startsWith("#")) return; // ignores links with no destination
      if (href === "/dashboard/clients") return;
      if (target.getAttribute("target") === "_blank") return; // allows links that open in a new tab. "_blank" open link in new tab
      const ok = window.confirm("You have unsaved changes. Leave this page?");
      if (!ok) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload); // beforeunload - browser event that is executed when user tries to exit out of page
    document.addEventListener("click", handleLinkClick, true); // listens for clicke events anywhere on the page
    return () => {
      // removes listeners after returning the function
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [hasUnsavedChanges]);

  /*
  checks if required fields are filled out before saving changes
  uses optional chaining to access properties in draft without throwing an error if draft or property is undefined
  */
  const canSave =
    Boolean(draft?.name?.trim()) &&
    isValidEmail(draft?.email) &&
    isValidPhone(draft?.phone) &&
    Boolean(draft?.address?.trim()) &&
    Boolean(draft?.propertyType?.trim());

  // can add a new client if theres no input draft or if you can save
  const canAddClient = !draft || canSave;

  // checks if input draft is empty >> blank client page
  const isDraftEmpty = (client) => {
    if (!client) return true;
    // cleans up the fields, returns the client info or empty field
    const name = String(client.name || "").trim();
    const email = String(client.email || "").trim();
    const phone = normalizePhone(client.phone || "");
    const address = String(client.address || "").trim();
    const notes = String(client.notes || "").trim();
    const extra = String(client.additionalInstructions || "").trim();
    // turns the strings to booleans then flips it. If theres a value in the input then boolean is false
    return !name && !email && !phone && !address && !notes && !extra; // returns true only if every field is empty
  }; 


  // prevents user from adding infinite new client forms
  const removeEmptyDraftIfNeeded = () => {
    if (!draft?.id) return;
    if (hasUnsavedChanges) return;
    if (!isDraftEmpty(draft)) return;
    // gets previous state of clients list, filter > keep clients whose id is NOT the draft id > updates the setClients useState with the new list
    setClients((prev) => prev.filter((client) => client.id !== draft.id));
  };


  /*
  the regular expression captures the numeric part of the client id,
  converts it to a number, uses reduece() to run a loop comparing the current number with the current maximum
  to then determine the largest client ID
  */
  const nextClientId = (items) => {
    const maxNum = items.reduce((max, client) => { // loops through the array of clients and build a final value
      const match = String(client.id || "").match(/^C-(\d+)$/); // .match builds an array and the regex captures the digit part into the [1] index
      const num = match ? Number(match[1]) : 0; // if match exists, convert to number
      return Number.isFinite(num) ? Math.max(max, num) : max; // gets the larger value between the current max and the current client number
    }, 0);
    return `C-${String(maxNum + 1).padStart(4, "0")}`; // generate nextClientId by incrementing maxNum and formatting it to 4 digits
  };


  // Jiro
  // Save a new or existing client through the protected admin API.
  const handleSave = async () => {
    if (!canSave) {
      const now = Date.now();
      if (now - lastSaveWarnAt < 1000) return false; // click throttling
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

  // Create a new draft client row while preventing spam clicks/duplicate empty drafts.
  const handleAddClient = () => {
    const now = Date.now(); // gets time in milliseconds
    if (now - lastAddAt < 3000) return; // 3 second delay before clicking add new client btn
    setLastAddAt(now);
    // if canAddClient isn't true then user gets alert message
    if (!canAddClient) {
      setAlertMessage("You have a new client form in progress. Please complete it before adding another.");
      setTimeout(() => setAlertMessage(""), 3000);
      return;
    }
    // unsaved changes popup
    if (hasUnsavedChanges) {
      setPendingClientId("__new__");
      setShowUnsavedModal(true);
      return;
    }
    const newClient = {
      id: nextClientId(clients),
      _isNew: true, // create new client in backend
      name: "",
      email: "",
      phone: "",
      city: "Calgary",
      province: "Alberta",
      address: "",
      propertyType: "House",
      notes: "",
      additionalInstructions: "",
    };
    setClients((prev) => [newClient, ...prev]); // updates client state and inserts newClient in front
    setSelectedId(newClient.id);
    setDraft(newClient); // sets form draft to newClient
  };

/*
when user selects a different client from the list
ensures that user is prompted with a warning when there is unsaved changes
*/
  const handleSelectClient = (clientId) => {
    if (clientId === selectedId) return;
    if (hasUnsavedChanges) {
      const now = Date.now();
      if (now - lastSwitchWarnAt < 1000) return; // 1 sec delay
      setLastSwitchWarnAt(now);
      setPendingClientId(clientId);
      setShowUnsavedModal(true);
      return;
    }
    removeEmptyDraftIfNeeded();
    setSelectedId(clientId);
  };

  const removeClientFromState = (clientId) => {
    const currentIndex = clients.findIndex((client) => client.id === clientId);
    const remainingClients = clients.filter((client) => client.id !== clientId);
    const nextSelectedClient =
      remainingClients[currentIndex] ||
      remainingClients[currentIndex - 1] ||
      remainingClients[0] ||
      null;

    setClients(remainingClients);
    setSelectedId(nextSelectedClient?.id ?? null);
    setDraft(nextSelectedClient);
  };

  const requestDeleteClient = () => {
    if (!draft?.id || busy) return;
    setDeleteTarget(draft);
  };

  const handleDeleteClient = async () => {
    if (!deleteTarget?.id || busy) return;

    if (deleteTarget._isNew) {
      removeClientFromState(deleteTarget.id);
      setDeleteTarget(null);
      setAlertMessage("Unsaved client draft removed.");
      setTimeout(() => setAlertMessage(""), 2500);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/clients?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to delete client.");
        return;
      }

      removeClientFromState(deleteTarget.id);
      setAlertMessage(`${deleteTarget.name || "Client"} deleted.`);
      setTimeout(() => setAlertMessage(""), 2500);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Failed to delete client.");
    } finally {
      setDeleteTarget(null);
      setBusy(false);
    }
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
                Don&apos;t save
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteTarget ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => setDeleteTarget(null)}
            aria-label="Close delete confirmation"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">Are you sure?</h2>
                <p className="admin-subtitle">
                  {deleteTarget._isNew
                    ? `This will remove the unsaved draft for ${deleteTarget.name || "this client"}.`
                    : `This will permanently delete ${deleteTarget.name || "this client"} from the database.`}
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setDeleteTarget(null)}
                type="button"
                disabled={busy}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--danger"
                type="button"
                onClick={handleDeleteClient}
                disabled={busy}
              >
                {busy ? "Deleting..." : "Yes, delete it"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
              >
                Keep client
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="admin-hero">
        <div>
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
                      maxLength={CLIENT_FIELD_LIMITS.name}
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
                      maxLength={CLIENT_FIELD_LIMITS.email}
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
                        const digits = normalizePhone(event.target.value).slice(0, 10);
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
                      maxLength={CLIENT_FIELD_LIMITS.notes}
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
                      maxLength={CLIENT_FIELD_LIMITS.address}
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
                      maxLength={CLIENT_FIELD_LIMITS.city}
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
                      maxLength={CLIENT_FIELD_LIMITS.province}
                      value={draft.province}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, province: event.target.value }))
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
                      maxLength={CLIENT_FIELD_LIMITS.additionalInstructions}
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
                <div className="admin-client-actions">
                  <button
                    className="admin-btn admin-btn--danger"
                    type="button"
                    onClick={requestDeleteClient}
                    disabled={busy}
                  >
                    Delete client
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
