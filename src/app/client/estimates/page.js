"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ClientLayout from "../../components/ClientLayout.js";
import { downloadEstimatePdf } from "../../lib/estimates/pdf.js";

const STATUS_CLASS = {
  Approved: "client-badge client-badge--active",
  Pending: "client-badge client-badge--pending",
  Rejected: "client-badge client-badge--rejected",
  "Quote requested": "client-badge client-badge--pending",
  "Converted to quote": "client-badge client-badge--active",
};

function getEstimateStatusLabel(estimate) {
  if (estimate?.quoteConvertedAt) return "Converted to quote";
  if (estimate?.quoteRequestedAt) return "Quote requested";
  return estimate?.status || "Pending";
}

export default function ClientEstimatesPage() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState("");
  const [activeMenuId, setActiveMenuId] = useState("");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});

  const [showLegalModal, setShowLegalModal] = useState(false);
  const [estimateToSign, setEstimateToSign] = useState(null);
  const [signingName, setSigningName] = useState("");
  const [signatureDate, setSignatureDate] = useState("");

  const [signedPdf, setSignedPdf] = useState(null);
  const [signedPdfName, setSignedPdfName] = useState("");


  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.includes("pdf")) {
        alert("Please upload a valid PDF file.");
        return;
      }
      setSignedPdf(file);
      setSignedPdfName(file.name);
  };

  useEffect(() => {
    let mounted = true;

    async function loadEstimates() {
      try {
        setLoading(true);
        const res = await fetch("/api/client/estimates", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setError(data?.error || "Failed to load estimates.");
          return;
        }

        setEstimates(data.estimates || []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Failed to load estimates data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEstimates();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: estimates.length,
      pending: estimates.filter((e) => getEstimateStatusLabel(e) === "Pending").length,
      approved: estimates.filter((e) => e.status === "Approved").length,
      rejected: estimates.filter((e) => e.status === "Rejected").length,
    };
  }, [estimates]);

  const handleSignEstimate = async (estimate) => {
    // Update signature date to today (uses local time currently)
    setSignatureDate(new Date().toISOString().split("T")[0]);
    setEstimateToSign(estimate);
    setSigningName("");
    setShowLegalModal(true);
  };

  const confirmSignature = async () => {
    if (!signingName.trim()) {
      alert("Please enter your full name to sign.");
      return;
    }

    if (!signedPdf) {
      alert("Please upload the signed PDF before proceeding.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("signerName", signingName.trim());
      formData.append("signatureDate", signatureDate);
      formData.append("signedPdf", signedPdf);

      const res = await fetch(`/api/client/estimates/${estimateToSign.id}/sign`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit signed document.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting signed PDF.");
    }

    setShowLegalModal(false);
    setEstimateToSign(null);
  };

  const handleRequestQuote = async (estimateId) => {
    setRequestingId(estimateId);
    try {
      const res = await fetch(`/api/client/estimates/${estimateId}/request-quote`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "Failed to request quote.");
        return;
      }

      setEstimates((current) =>
        current.map((estimate) =>
          estimate.id === estimateId ? { ...estimate, ...data.estimate } : estimate
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to request quote.");
    } finally {
      setRequestingId("");
    }
  };

  useEffect(() => {
    function handleWindowChange() {
      if (!activeMenuId) return;
      const button = menuButtonRefs.current[activeMenuId];
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.right - 160),
      });
    }

    handleWindowChange();
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);
    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [activeMenuId]);

  return (
    <ClientLayout>
      <section className="client-hero">
        <div>
          <p className="client-kicker">ESTIMATES</p>
          <h1 className="client-title">Your Estimates</h1>
          <p className="client-subtitle">
            Review pending estimates and approved proposals. Digital signatures are legally binding.
          </p>
          {error ? <p className="client-error">{error}</p> : null}
        </div>
      </section>

      <section className="client-summary-grid mb-8">
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Total</div>
          <div className="client-stat-value">{stats.total}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Pending</div>
          <div className="client-stat-value">{stats.pending}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Approved</div>
          <div className="client-stat-value">{stats.approved}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Rejected</div>
          <div className="client-stat-value">{stats.rejected}</div>
        </article>
      </section>

<section className="w-full">
  <article className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
    {/* Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Estimates</h2>
      <div className="text-sm text-gray-500 font-medium">
        {estimates.length} estimate{estimates.length === 1 ? "" : "s"} total
      </div>
    </div>

    {loading ? (
      <div className="w-full text-center py-16">
        <div className="text-gray-500 text-lg">Loading estimates...</div>
      </div>
    ) : estimates.length === 0 ? (
      <div className="w-full text-center py-16">
        <div className="text-gray-500 text-lg">No estimates found.</div>
      </div>
    ) : (
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[600px] table-auto">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">
                Service
              </th>
              <th className="text-right py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider hidden table-cell">
                Amount
              </th>
              <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider hidden table-cell">
                Created
              </th>
              <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider w-48">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {estimates.map((estimate) => (
              <tr 
                key={estimate.id} 
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="py-5 px-6 align-top">
                  <div className="font-semibold text-gray-900 text-base leading-tight">
                    {estimate.title || estimate.service}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {estimate.notes || "-"}
                  </div>
                </td>
                <td className="py-5 px-6 text-right font-bold text-xl text-gray-900 hidden table-cell">
                  ${estimate.price}
                </td>
                <td className="py-5 px-6 text-center">
                  <span className={`${STATUS_CLASS[getEstimateStatusLabel(estimate)] || "client-badge"} inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                    {getEstimateStatusLabel(estimate)}
                  </span>
                </td>                
                <td className="py-5 px-2 text-center text-sm text-gray-500 hidden table-cell">
                  {estimate.createdAt?.split("T")[0] || "-"}
                </td>
                <td className="py-5 px-6">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {!estimate.quoteRequestedAt && !estimate.quoteConvertedAt ? (
                      <button
                        type="button"
                        onClick={() => handleRequestQuote(estimate.id)}
                        disabled={requestingId === estimate.id}
                        className="bg-[#477a40] hover:bg-[#3d652f] text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {requestingId === estimate.id ? "Requesting..." : "Request quote"}
                      </button>
                    ) : estimate.quoteRequestedAt && !estimate.quoteConvertedAt ? (
                      <span className="inline-flex items-center justify-center rounded-lg border border-[#477a40]/20 bg-[#477a40]/10 px-4 py-2 text-sm font-semibold text-[#477a40]">
                        Quote requested
                      </span>
                    ) : null}

                    <div className="shrink-0">
                      <button
                        ref={(node) => {
                          if (node) {
                            menuButtonRefs.current[estimate.id] = node;
                          } else {
                            delete menuButtonRefs.current[estimate.id];
                          }
                        }}
                        type="button"
                        onClick={() => {
                          if (activeMenuId === estimate.id) {
                            setActiveMenuId("");
                            return;
                          }
                          const rect = menuButtonRefs.current[estimate.id]?.getBoundingClientRect();
                          setMenuPosition({
                            top: (rect?.bottom || 0) + 8,
                            left: Math.max(16, (rect?.right || 160) - 160),
                          });
                          setActiveMenuId(estimate.id);
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200"
                      >
                        Manage
                      </button>
                    </div>

                    {estimate.status === "Pending" && !estimate.quoteRequestedAt && !estimate.quoteConvertedAt ? (
                      <button
                        onClick={() => handleSignEstimate(estimate)}
                        className="bg-[#477a40] hover:bg-[#3d652f] text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95 transition-all duration-200 whitespace-nowrap items-center justify-center hover:cursor-pointer"
                      >
                        Sign Now
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </article>
      </section>

      {activeMenuId ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default bg-transparent"
            aria-label="Close manage menu"
            onClick={() => setActiveMenuId("")}
          />
          <div
            className="fixed z-30 min-w-[160px] rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          >
            {(() => {
              const activeEstimate = estimates.find((estimate) => estimate.id === activeMenuId);
              if (!activeEstimate) return null;

              return (
                <>
                  <a
                    href={`/client/estimates/${activeEstimate.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setActiveMenuId("")}
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="block rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={async () => {
                      setActiveMenuId("");
                      try {
                        await downloadEstimatePdf(activeEstimate);
                      } catch (downloadError) {
                        console.error(downloadError);
                        alert("Failed to download estimate PDF.");
                      }
                    }}
                  >
                    Download
                  </button>
                </>
              );
            })()}
          </div>
        </>
      ) : null}

      {/* PIPEDA/UECA Legal Modal */}
      {showLegalModal && estimateToSign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Electronically Sign Estimate
              </h2>
              <button
                onClick={() => setShowLegalModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl hover:cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 text-lg">Legal Notice</h3>
              <p className="text-sm text-blue-900 leading-relaxed">
                <strong>This is a legally binding electronic signature</strong> under{" "}
                <strong>PIPEDA</strong> (Canada) and <strong>UECA</strong> (Uniform Electronic 
                Commerce Act). By signing below, you agree to the terms of this estimate 
                and authorize work to proceed.
              </p>
              <div className="text-xs text-blue-800 bg-blue-100 p-2 rounded">
                Your signature is timestamped and stored securely. You will receive a 
                signed copy via email.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={signingName}
                  onChange={(e) => setSigningName(e.target.value)}
                  placeholder="Enter your full name exactly as it appears on ID"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Upload Signed Estimate PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all"
                />
                {signedPdfName && (
                  <div className="mt-2 text-sm text-gray-600">
                    Attached: {signedPdfName}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setSignedPdf(null);
                        setSignedPdfName("");
                      }}
                      className="text-[#477a40] font-semibold hover:underline"
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Date: <span className="font-semibold">{signatureDate}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLegalModal(false)}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all hover:cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSignature}
                  className="flex-1 py-3 px-6 bg-[#477a40] text-white font-semibold rounded-lg hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-100 transform transition-all active:scale-95 hover:cursor-pointer"
                >
                  I Agree & Sign Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
