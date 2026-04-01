"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json().catch(() => ({}));
        if (!active) return;

        if (!userRes.ok || !userData?.user) {
          setError(userData?.error || "Failed to load profile.");
          return;
        }

        setFormData({
          name: userData.user.name || "",
          email: userData.user.email || "",
        });
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setError("Failed to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
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
        setError(data?.error || "Failed to save profile.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        name: data?.user?.name || prev.name,
        email: data?.user?.email || prev.email,
      }));
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Settings</h1>
          <p className="admin-subtitle">Manage your profile information.</p>
          {error ? <p className="admin-error">{error}</p> : null}
          {success ? <p className="admin-success">{success}</p> : null}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">User Profile</h2>
        </div>

        {loading ? (
          <p className="admin-muted">Loading profile...</p>
        ) : (
          <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: "720px" }}>
            <label className="admin-field admin-field--full">
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

            <label className="admin-field admin-field--full">
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
            <div className="admin-modal__actions admin-field--full">
              <div className="admin-modal__actions-right">
                <button
                  className="admin-btn admin-btn--primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </AdminLayout>
  );
}
