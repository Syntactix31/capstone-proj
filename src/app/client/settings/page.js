"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClientLayout from "../../components/ClientLayout.js";

export default function ClientSettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load current client data on mount
  useEffect(() => {
    async function loadClientData() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        
        if (data?.user?.email) {
          // Fetch full client profile
          const clientRes = await fetch("/api/client/profile", { cache: "no-store" });
          const clientData = await clientRes.json();
          
          if (clientRes.ok && clientData.client) {
            setFormData({
              name: clientData.client.name || "",
              email: clientData.client.email || data.user.email || "",
              phone: clientData.client.phone || "",
            });
          } else {
            setFormData({
              name: data.user.name || "",
              email: data.user.email || "",
              phone: "",
            });
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }

    loadClientData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        
        // NOTE: HARD REFRESH CHANGE AFTER DEBUG FIXES!!!!!!!!!!!!
        window.location.reload();


        return;
      } else {
        const data = await res.json();
        setError(data.error || data.details || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientLayout>
      <section className="bg-white p-10 rounded-xl mb-8 shadow-lg">
        <div>
          <p className="text-[#477a40] font-semibold uppercase tracking-wide text-sm mb-2">
            Account Settings
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Update Your Information
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Manage your contact details. Changes will be saved to your client profile.
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-[#477a40] font-medium flex items-center">
              {success}

              {/* <span className="text-[#477a40] text-sm ml-2">Refreshing...</span> */}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <article className="bg-white rounded-xl p-6 shadow-lg col-span-full">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              Contact Information
            </h2>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#477a40] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md space-y-6">
              <div className="space-y-2">
                <label className="block font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#477a40] transition-all duration-200 bg-white disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Enter your full name"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#477a40] transition-all duration-200 bg-white disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="your.email@example.com"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#477a40] transition-all duration-200 bg-white disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="123-456-7890"
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <button
                  type="button"
                  className="flex-1 py-4 px-6 max-h-14 border-2 border-[#477a40] hover:cursor-pointer text-green-700 font-semibold rounded-lg max-w-50 hover:bg-red-400 hover:text-white hover:border-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 bg-[#477a40] max-h-14 text-white font-semibold rounded-lg hover:cursor-pointer hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-100 transform  transition-all duration-200 disabled:bg-[#477a40] disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center active:scale-95"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}
        </article>
      </section>
    </ClientLayout>
  );
}