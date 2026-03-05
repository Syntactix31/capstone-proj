"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout.js";

const CLIENTS = [
  {
    id: "C-3001",
    name: "Natasha Wheeler",
    email: "natasha.wheeler@email.com",
    phone: "(587) 555-0142",
    city: "Edmonton",
    province: "Alberta",
    address: "11260 Groat Road Northwest",
    postal: "T5M 3J8",
    propertyType: "House",
    notes: "",
    additionalInstructions: "",
  },
  {
    id: "C-3002",
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    phone: "(403) 555-0101",
    city: "Calgary",
    province: "Alberta",
    address: "123 Main St",
    postal: "T2P 4K9",
    propertyType: "Townhome",
    notes: "",
    additionalInstructions: "",
  },
  {
    id: "C-3003",
    name: "Avery Chen",
    email: "avery.chen@email.com",
    phone: "(587) 555-0199",
    city: "Calgary",
    province: "Alberta",
    address: "44 5 Ave SW",
    postal: "T2P 0L4",
    propertyType: "Condo",
    notes: "",
    additionalInstructions: "",
  },
  {
    id: "C-3004",
    name: "Morgan Park",
    email: "morgan.park@email.com",
    phone: "(780) 555-0127",
    city: "Red Deer",
    province: "Alberta",
    address: "80 17 Ave",
    postal: "T4N 1B2",
    propertyType: "House",
    notes: "",
    additionalInstructions: "",
  },
];

export default function AdminClientsPage() {
  const [clients, setClients] = useState(CLIENTS);
  const [selectedId, setSelectedId] = useState(CLIENTS[0]?.id ?? null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId) || clients[0],
    [clients, selectedId]
  );
  const [draft, setDraft] = useState(selectedClient);

  useEffect(() => {
    setDraft(selectedClient);
  }, [selectedClient]);

  const handleSave = () => {
    if (!draft?.id) return;
    setClients((prev) =>
      prev.map((client) => (client.id === draft.id ? { ...client, ...draft } : client))
    );
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
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn--primary" type="button">
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
          <div className="admin-client-header">
            <div className="admin-client-avatar admin-client-avatar--large">
              {selectedClient.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="admin-client-title">{selectedClient.name}</h2>
              <div className="admin-client-sub">{selectedClient.id}</div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h3 className="admin-section-title">Client details</h3>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={handleSave}
              >
                Save changes
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
                  value={draft.email}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Phone</span>
                <input
                  className="admin-input"
                  value={draft.phone}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
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
              <button className="admin-btn admin-btn--ghost admin-btn--small" type="button">
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
        </div>
      </section>
    </AdminLayout>
  );
}
