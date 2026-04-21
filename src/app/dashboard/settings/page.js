"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({
    adminCount: 0,
    googleAdminCount: 0,
    localAdminCount: 0,
    admins: [],
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/profile", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to load admin settings.");
        return;
      }

      setUser(data.user || null);
      setSummary(data.summary || { adminCount: 0, googleAdminCount: 0, localAdminCount: 0, admins: [] });
      setHistory(Array.isArray(data.history) ? data.history : []);
      setFormData({
        name: data?.user?.name || "",
        email: data?.user?.email || "",
      });
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load admin settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to save admin settings.");
        return;
      }

      setUser(data?.user || null);
      setFormData({
        name: data?.user?.name || formData.name,
        email: data?.user?.email || formData.email,
      });
      setSuccess("Settings saved successfully.");
      await loadSettings();
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save admin settings.");
    } finally {
      setSaving(false);
    }
  };

  const latestAdminNames = useMemo(
    () => (summary.admins || []).map((admin) => admin.name).filter(Boolean).slice(0, 3),
    [summary.admins]
  );

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Admin Center</p>
          <h1 className="admin-title">Settings</h1>
          <p className="admin-subtitle">
            Manage your administrator profile and review recent admin activity from one place.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
          {success ? <p className="admin-success">{success}</p> : null}
        </div>
      </section>

      <section
        className="admin-grid admin-settings-grid"
      >
        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Administrator Profile</h2>
                <p className="admin-muted">Keep your account details current for team visibility and access control.</p>
              </div>
            </div>

            {loading ? (
              <p className="admin-muted">Loading profile...</p>
            ) : (
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form__row admin-form__row--two">
                  <label className="admin-field">
                    <span className="admin-label">Full name</span>
                    <input
                      className="admin-input"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={saving}
                    />
                  </label>

                  <label className="admin-field">
                    <span className="admin-label">Email</span>
                    <input
                      className="admin-input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={saving}
                    />
                  </label>
                </div>

                <div className="admin-modal__actions admin-field--full" style={{ marginTop: "10px" }}>
                  <div className="admin-modal__actions-right">
                    <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Admin Team Snapshot</h2>
                <p className="admin-muted">
                  {latestAdminNames.length
                    ? `Recent admins: ${latestAdminNames.join(", ")}`
                    : "Your current admin roster and sign-in mix."}
                </p>
              </div>
            </div>

            <div className="admin-summary-grid">
              <article className="admin-summary-card">
                <div className="admin-summary-label">Total admins</div>
                <div className="admin-summary-value">{summary.adminCount}</div>
              </article>
              <article className="admin-summary-card">
                <div className="admin-summary-label">Google sign-in</div>
                <div className="admin-summary-value">{summary.googleAdminCount}</div>
              </article>
              <article className="admin-summary-card">
                <div className="admin-summary-label">Local accounts</div>
                <div className="admin-summary-value">{summary.localAdminCount}</div>
              </article>
              <article className="admin-summary-card">
                <div className="admin-summary-label">Recent activity</div>
                <div className="admin-summary-value">{history.length}</div>
              </article>
            </div>

            <div className="admin-stack admin-settings-team-list">
              {(summary.admins || []).map((admin) => (
                <article key={admin.id} className="admin-settings-entry admin-settings-entry--muted">
                  <div className="admin-settings-entry__header">
                    <div className="admin-settings-entry__meta">
                      <div className="admin-settings-entry__title">{admin.name}</div>
                      <div className="admin-muted">{admin.email}</div>
                    </div>
                    <span className="admin-badge admin-badge--active">
                      {admin.provider === "google" ? "Google" : "Local"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-card admin-settings-history-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Admin History</h2>
              <p className="admin-muted">
                Recent administrator actions with the admin name, action taken, and supporting details.
              </p>
            </div>
          </div>

          <div className="admin-settings-history-scroll">
            {loading ? (
              <p className="admin-muted">Loading history...</p>
            ) : history.length ? (
              <div className="admin-stack">
                {history.map((entry) => (
                  <article key={entry.id} className="admin-settings-entry">
                    <div className="admin-settings-entry__header">
                      <div className="admin-settings-entry__meta">
                        <div className="admin-settings-entry__title">
                          {entry.adminName || entry.adminEmail || "Unknown admin"}
                        </div>
                        <div className="admin-muted">{entry.adminEmail || "No email recorded"}</div>
                      </div>
                      <span className="admin-badge admin-badge--active">{entry.action}</span>
                    </div>
                    <p className="admin-settings-entry__details">
                      {entry.details || "No additional details recorded."}
                    </p>
                    <div className="admin-muted">{formatDateTime(entry.createdAt)}</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-settings-empty">
                <p className="admin-muted admin-settings-empty__text">
                  No admin activity has been recorded yet. The first action will appear here once an administrator updates settings.
                </p>
              </div>
            )}
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}
