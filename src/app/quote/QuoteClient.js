"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import QuoteSuccessModal from "../components/QuoteSuccessModal.js"; 

const ESTIMATE_SERVICE_KEYS = new Set(["fence", "deck", "pergola", "sod", "trees-shrubs"]);

export default function QuoteClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Parse multiple services from query: ?service=fence,sod,deck-railing
  const serviceSlugs = (searchParams.get("service") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  
  const services = {
    fence: { title: "Fence", key: "fence" },
    "deck-railing": { title: "Deck & Railing", key: "deck" },
    pergola: { title: "Pergola", key: "pergola" },
    sod: { title: "Sod", key: "sod" },
    "trees-shrubs": { title: "Trees & Shrubs", key: "trees-shrubs" },
  };

  const selectedServices = serviceSlugs
    .map(slug => services[slug])
    .filter(s => !!s);


  const [formData, setFormData] = useState({
    client: { name: "", address: "", email: "", phone: "" },
    project: {
      fence: { gates: "", linearFt: "", height: "4'", postSize: "4x4", pressureTreated: false },
      deck: { length: "", width: "", height: "", railing: "none" },
      pergola: { length: "", width: "", height: "" },
      sod: { squareFt: "", length: "", width: "", condition: "", gradingNeeded: false },
      "trees-shrubs": { numTrees: "", numShrubs: "", treeSize: "", shrubSize: "", purpose: "", irrigation: false },
    },
    files: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [summary, setSummary] = useState("");
  const [instantEstimates, setInstantEstimates] = useState({}); // Changed to object: {fence: estimate, sod: estimate}
  const [estimateErrors, setEstimateErrors] = useState({});
  const [displayPhone, setDisplayPhone] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.client.name) newErrors.clientName = "Required";
    if (!formData.client.email) newErrors.clientEmail = "Required";
    if (!formData.client.phone) {
      newErrors.client_phone = "Phone number is required";
    } else {
      const digits = formData.client.phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.client_phone = "Enter a 10-digit phone number.";
      }
    }
    if (selectedServices.length === 0) newErrors.services = "Select services first";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatMoney = (value, currency = "CAD") =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  // Build payload for a SINGLE service
  const buildEstimatePayload = (serviceKey) => {
    if (!ESTIMATE_SERVICE_KEYS.has(serviceKey)) return null;

    const claim = {
      name: formData.client.name,
      address: formData.client.address,
      email: formData.client.email,
      phone: formData.client.phone,
    };

    if (serviceKey === "fence") {
      return {
        claim,
        projectType: "fence",
        project: {
          projectType: "fence",
          gates: formData.project.fence.gates,
          linearFt: formData.project.fence.linearFt,
          height: formData.project.fence.height,
          postSize: formData.project.fence.postSize,
          pressureTreated: formData.project.fence.pressureTreated,
        },
      };
    }
    if (serviceKey === "deck") {
      return {
        claim,
        projectType: "deck-railing",
        project: {
          projectType: "deck-railing",
          length: formData.project.deck.length,
          width: formData.project.deck.width,
          height: formData.project.deck.height,
          railing: formData.project.deck.railing,
        },
      };
    }
    if (serviceKey === "pergola") {
      return {
        claim,
        projectType: "pergola",
        project: {
          projectType: "pergola",
          length: formData.project.pergola.length,
          width: formData.project.pergola.width,
          height: formData.project.pergola.height,
        },
      };
    }
    if (serviceKey === "sod") {
      return {
        claim,
        projectType: "sod",
        project: {
          projectType: "sod",
          squareFt: formData.project.sod.squareFt,
          length: formData.project.sod.length,
          width: formData.project.sod.width,
          condition: formData.project.sod.condition,
          gradingNeeded: formData.project.sod.gradingNeeded,
        },
      };
    }
    if (serviceKey === "trees-shrubs") {
      return {
        claim,
        projectType: "trees-shrubs",
        project: {
          projectType: "trees-shrubs",
          numTrees: formData.project["trees-shrubs"].numTrees,
          numShrubs: formData.project["trees-shrubs"].numShrubs,
          treeSize: formData.project["trees-shrubs"].treeSize,
          shrubSize: formData.project["trees-shrubs"].shrubSize,
          purpose: formData.project["trees-shrubs"].purpose,
          irrigation: formData.project["trees-shrubs"].irrigation,
        },
      };
    }
    return null;
  };

  // Estimate for just each service but when mutplie services selected
  const fetchInstantEstimates = async () => {
    const newEstimates = {};
    const newErrors = {};

    for (const service of selectedServices) {
      if (ESTIMATE_SERVICE_KEYS.has(service.key)) {
        try {
          const payload = buildEstimatePayload(service.key);
          if (payload) {
            const res = await fetch("/api/estimate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
              newEstimates[service.key] = data;
            } else {
              newErrors[service.key] = data?.error || "Estimate unavailable";
            }
          }
        } catch (err) {
          newErrors[service.key] = "Estimate calculation failed";
        }
      }
    }

    setInstantEstimates(newEstimates);
    setEstimateErrors(newErrors);
  };

  const handleEstimatePreview = async () => {
    if (!validateForm()) return;
    setIsCalculating(true);
    try {
      await fetchInstantEstimates();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await fetchInstantEstimates();

      const projectTablesHTML = selectedServices.map(service => {
        const project = formData.project[service.key];
        const projectFieldsHTML = Object.entries(project)
          .map(([key, value]) => {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .replace(/\s+/g, ' ')
              .trim() + ':';

            if (typeof value === "boolean") {
              return `<tr><td style="text-transform: capitalize;"><b>${formattedKey}</b></td><td>${value ? "Yes" : "No"}</td></tr>`;
            }
            return `<tr><td><b>${formattedKey}</b></td><td>${value || "-"}</td></tr>`;
          })
          .join("");

        let estimateHTML = "";
        if (instantEstimates[service.key]) {
          const estimate = instantEstimates[service.key];
          estimateHTML = `
            <h3 style="border-bottom:2px solid #458500;margin-top:16px;padding-bottom:4px;">${service.title} Instant Estimate</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td><strong>Subtotal:</strong></td><td>${formatMoney(estimate.subtotal, estimate.currency)}</td></tr>
              <tr><td><strong>Tax:</strong></td><td>${formatMoney(estimate.tax, estimate.currency)}</td></tr>
              <tr><td><strong>Total:</strong></td><td><strong>${formatMoney(estimate.total, estimate.currency)}</strong></td></tr>
            </table>
          `;
        }

        return `
          <div style="margin-bottom:24px;">
            <h3 style="border-bottom:2px solid #458500;padding-bottom:4px;">${service.title} Details</h3>
            <table style="width:100%;border-collapse:collapse;">${projectFieldsHTML}</table>
            ${estimateHTML}
          </div>
        `;
      }).join("<hr style='border: none; border-top: 2px solid #eee; margin: 24px 0;'>");


      let projectSummaryHTML = "";
      const estimatableServices = selectedServices.filter(s => ESTIMATE_SERVICE_KEYS.has(s.key));
      
      if (selectedServices.length > 1 && estimatableServices.length > 0) {
        const projectSubtotal = Object.values(instantEstimates)
          .reduce((sum, est) => sum + (est?.subtotal || 0), 0);
        const projectTax = Object.values(instantEstimates)
          .reduce((sum, est) => sum + (est?.tax || 0), 0);
        const projectTotal = Object.values(instantEstimates)
          .reduce((sum, est) => sum + (est?.total || 0), 0);

        const serviceBreakdownHTML = estimatableServices.map(service => {
          const estimate = instantEstimates[service.key];
          if (estimate) {
            return `
              <tr>
                <td style="font-weight: 500;">${service.title}</td>
                <td style="text-align: right; font-weight: bold;">${formatMoney(estimate.total, estimate.currency)}</td>
              </tr>
            `;
          }
          return `<tr><td style="font-weight: 500;">${service.title}</td><td style="text-align: right;">Estimate pending</td></tr>`;
        }).join("");

        projectSummaryHTML = `
          <div style="margin:24px 0;border:2px solid #458500;border-radius:8px;padding:10px;">
            <h3 style="border-bottom:2px solid #458500;padding-bottom:4px;margin-bottom:16px;">Project Summary</h3>
            
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:8px 0;"><strong>Services (${estimatableServices.length}):</strong></td>
                <td style="text-align: right;padding:8px 0;font-weight:bold;">${estimatableServices.map(s => s.title).join(", ")}</td>
              </tr>
            </table>

            <table style="width:100%;border-collapse:collapse;">
              ${serviceBreakdownHTML}
              <tr style="border-top:2px solid #458500;">
                <td style="padding:12px 0 8px 0;"><strong>Project Subtotal:</strong></td>
                <td style="text-align: right;padding:12px 0 8px 0;font-weight:bold;">${formatMoney(projectSubtotal)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;"><strong>Tax:</strong></td>
                <td style="text-align: right;padding:8px 0;font-weight:bold;">${formatMoney(projectTax)}</td>
              </tr>
              <tr style="border-top:1px solid #ddd;">
                <td style="padding:12px 0;"><strong>PROJECT TOTAL:</strong></td>
                <td style="text-align: right;padding:12px 0;font-weight:bold;color:#458500;">${formatMoney(projectTotal)}</td>
              </tr>
            </table>

            ${estimatableServices.length < selectedServices.length ? `
              <p style="color:#666;font-style:italic;margin-top:8px;">
                * Some services don't have instant estimates available
              </p>
            ` : ""}
          </div>
        `;

      }


      const formatPhoneNumber = (phone) => {
        if (!phone) return "-";
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
          return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        }
        return phone;
      };

      const messageHTML = `
        <div style="max-width:600px;margin:auto;background:#fff;font-family:arial,sans-serif;color:#333;">
          <div style="border-top:6px solid #458500;padding:16px;">
            <img src=https://landscape-craftsmen.vercel.app/icon.svg style="height:40px;vertical-align:middle;margin-right:8px;">
            <a href="https://landscape-craftsmen.vercel.app/" style="text-decoration:none;font-weight:bold;color:#333;">Landscape Craftsmen</a>
            <span style="font-size:16px;vertical-align:middle;border-left:1px solid #333;padding-left:8px;"><strong>New Quote Request</strong></span>
          </div>

          <div style="padding:16px;">
            <p>You have received a new estimate request through your website.</p>
            <h3 style="border-bottom:2px solid #458500;padding-bottom:4px;">Client Information</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td><strong>Name:</strong></td><td>${formData.client.name}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${formData.client.email}</td></tr>
              <tr><td><strong>Address:</strong></td><td>${formData.client.address || "-"}</td></tr>
              <tr><td><strong>Phone:</strong></td><td>${formatPhoneNumber(formData.client.phone)}</td></tr>
            </table>
          
            ${projectSummaryHTML}

            ${projectTablesHTML}

            ${formData.files.length > 0 ? `
              <h4 style="margin-top:16px;">Uploaded Files</h4>
              <p>${formData.files.map((f) => f.name).join(", ")}</p>
            ` : ""}
          </div>
        </div>
      `;

      // Handle file attachments
      const attachments = formData.files.length > 0
        ? await Promise.all(
            Array.from(formData.files).map(async (file) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              return new Promise((resolve) => {
                reader.onload = () => {
                  const base64 = reader.result.split(",")[1];
                  resolve({
                    filename: file.name,
                    content: base64,
                  });
                };
              });
            })
          )
        : [];

      const res = await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: formData.client.email,
          subject: `New Estimate Request: ${selectedServices.map(s => s.title).join(", ")}`,
          message_html: messageHTML,
          attachments,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Backend response:", errText);
        throw new Error("Send failed");
      }

      setSummary(`Thanks ${formData.client.name}! Details for ${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} sent to our team.`);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Send failed—try again or contact us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch estimate for one service (individual buttons)
  const fetchSingleEstimate = async (serviceKey) => {
    if (!ESTIMATE_SERVICE_KEYS.has(serviceKey)) return;

    try {
      const payload = buildEstimatePayload(serviceKey);
      if (!payload) return;

      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setInstantEstimates((prev) => ({
          ...prev,
          [serviceKey]: data,
        }));
        setEstimateErrors((prev) => ({
          ...prev,
          [serviceKey]: undefined,
        }));
      } else {
        setEstimateErrors((prev) => ({
          ...prev,
          [serviceKey]: data?.error || "Estimate unavailable",
        }));
      }
    } catch (err) {
      console.error(err);
      setEstimateErrors((prev) => ({
        ...prev,
        [serviceKey]: "Estimate calculation failed",
      }));
    }
  };


  const resetForm = () => {
    setFormData({
      client: { name: "", address: "", email: "", phone: "" },
      project: {
        fence: { gates: "", linearFt: "", height: "4'", postSize: "4x4", pressureTreated: false },
        deck: { length: "", width: "", height: "", railing: "none" },
        pergola: { length: "", width: "", height: "" },
        sod: { squareFt: "", length: "", width: "", condition: "", gradingNeeded: false },
        "trees-shrubs": { numTrees: "", numShrubs: "", treeSize: "", shrubSize: "", purpose: "", irrigation: false },
      },
      files: [],
    });
    setInstantEstimates({});
    setEstimateErrors({});
    setSummary("");
  };
  useEffect(() => {
  const raw = formData.client.phone || '';
  if (raw.length === 10) {
    setDisplayPhone(`(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6)}`);
  } else {
    setDisplayPhone(raw);  // Partial input shows raw digits
  }
}, [formData.client.phone]);

  const updateProjectField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      project: {
        ...prev.project,
        [section]: { ...prev.project[section], [field]: value }
      }
    }));
  };

  // Show service selection prompt if no services selected
  if (selectedServices.length === 0) {
    return (
      <div className="overflow-hidden bg-white min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 -mt-35">
          <Link 
            href="/services-quote" 
            className="rounded-2xl bg-[#477a40] px-8 py-4 text-lg font-bold text-white hover:bg-white hover:border-[#477A40] hover:text-[#477A40] hover:scale-105 hover:border-2 transition-all shadow-lg"
          >
            Select a Service First →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col justify-start px-4 pb-12">
        <div className="w-full mx-auto max-w-6xl px-4 mt-12">
          <h2 className="mx-auto w-fit text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">
            Free Estimate: {selectedServices.map(s => s.title).join(", ")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="w-full mx-auto max-w-2xl px-4 mt-8 space-y-8">
          {/* Client Information - Shared across all services */}
          <section className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
            <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2 mb-6">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Full Name *</label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.client.name}
                  // onChange={(e) => setFormData({ ...formData, client: { ...formData.client, name: e.target.value } })}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
                    setFormData({
                      ...formData,
                      client: { ...formData.client, name: filtered },
                    });
                  }}                  
                  className="w-full p-4 border border-gray-300 rounded-xl"
                  required
                />
                {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Email *</label>
                <input 
                  type="email" 
                  pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                  maxLength={35}
                  placeholder="user@mailservice.com"
                  value={formData.client.email} 
                  onChange={(e) => setFormData({ ...formData, client: { ...formData.client, email: e.target.value } })} 
                  className="w-full p-4 border border-gray-300 rounded-xl" 
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Home Address *</label>
                <input 
                  type="text"
                  maxLength={100} 
                  value={formData.client.address} 
                  onChange={(e) => setFormData({ ...formData, client: { ...formData.client, address: e.target.value } })} 
                  className="w-full p-4 border border-gray-300 rounded-xl" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number *</label>
                {/* <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={10} 
                  value={formData.client.phone} 
                  onChange={(e) => { 
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, client: { ...formData.client, phone: onlyDigits }}) 
                  }} 
                  className="w-full p-4 border border-gray-300 rounded-xl" 
                  required
                /> */}

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}  // Allows for (###) ###-####
                  pattern="^\(\d{3}\) \d{3}-\d{4}$"
                  placeholder="(403) 123-4567"
                  value={displayPhone}
                  required
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({
                      ...formData,
                      client: { ...formData.client, phone: value }  // Raw 10 digits stored
                    });
                    // Format display: (403) 345-8118
                    const formatted = value === 10
                      ? `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`
                      : '';
                    setDisplayPhone(formatted);
                  }}
                  className="w-full p-4 border border-gray-300 rounded-xl required"
                />
              </div>
            </div>
          </section>

          {/* Individual Service Sections */}
          {selectedServices.map((service) => (
            <section key={service.key} className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
              <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2 mb-6">
                {service.title} Project Details
              </h3>
              
              {service.key === "fence" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Number of Gates</label>
                    <input type="number" value={formData.project.fence.gates} onChange={(e) => updateProjectField("fence", "gates", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Total Linear Feet</label>
                    <input type="number" value={formData.project.fence.linearFt} onChange={(e) => updateProjectField("fence", "linearFt", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Height</label>
                    <select value={formData.project.fence.height} onChange={(e) => updateProjectField("fence", "height", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                      <option value="4'">4&apos;</option>
                      <option value="5'">5&apos;</option>
                      <option value="6'">6&apos;</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Post Size</label>
                    <select value={formData.project.fence.postSize} onChange={(e) => updateProjectField("fence", "postSize", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                      <option value="4x4">4x4</option>
                      <option value="4x6">4x6</option>
                      <option value="6x6">6x6</option>
                    </select>
                  </div>
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.project.fence.pressureTreated} onChange={(e) => updateProjectField("fence", "pressureTreated", e.target.checked)} className="mr-2" />
                    <span className="text-sm font-bold text-gray-900">Pressure Treated Wood</span>
                  </label>
                </div>
              )}
              
              {service.key === "deck" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Length (ft)</label>
                    <input type="number" value={formData.project.deck.length} onChange={(e) => updateProjectField("deck", "length", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Width (ft)</label>
                    <input type="number" value={formData.project.deck.width} onChange={(e) => updateProjectField("deck", "width", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Height (ft)</label>
                    <input type="number" value={formData.project.deck.height} onChange={(e) => updateProjectField("deck", "height", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2">Railing</label>
                    <select value={formData.project.deck.railing} onChange={(e) => updateProjectField("deck", "railing", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                      <option value="none">Without</option>
                      <option value="with">With PPT</option>
                      <option value="with-alum">With Aluminum</option>
                    </select>
                  </div>
                </div>
              )}
              
              {service.key === "pergola" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-bold mb-2">Length (ft)</label><input type="number" value={formData.project.pergola.length} onChange={(e) => updateProjectField("pergola", "length", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" /></div>
                  <div><label className="block text-sm font-bold mb-2">Width (ft)</label><input type="number" value={formData.project.pergola.width} onChange={(e) => updateProjectField("pergola", "width", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" /></div>
                  <div><label className="block text-sm font-bold mb-2">Height (ft)</label><input type="number" value={formData.project.pergola.height} onChange={(e) => updateProjectField("pergola", "height", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" /></div>
                </div>
              )}
              
              {service.key === "sod" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Total Square Footage</label>
                    <input type="number" value={formData.project.sod.squareFt} onChange={(e) => updateProjectField("sod", "squareFt", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Area Dimensions (L x W)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="Length (ft)" value={formData.project.sod.length} onChange={(e) => updateProjectField("sod", "length", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                      <input type="number" placeholder="Width (ft)" value={formData.project.sod.width} onChange={(e) => updateProjectField("sod", "width", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Current Ground Condition</label>
                    <select value={formData.project.sod.condition} onChange={(e) => updateProjectField("sod", "condition", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                      <option value="">Select condition</option>
                      <option value="bare-dirt">Bare Dirt</option>
                      <option value="weedy">Weedy/Overgrown</option>
                      <option value="poor-grass">Poor Existing Grass</option>
                      <option value="new-construction">New Construction</option>
                    </select>
                  </div>
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.project.sod.gradingNeeded} onChange={(e) => updateProjectField("sod", "gradingNeeded", e.target.checked)} className="mr-2" />
                    <span className="text-sm font-bold text-gray-900">Grading/Site Prep Needed</span>
                  </label>
                </div>
              )}
              
              {service.key === "trees-shrubs" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Number of Trees</label>
                    <input type="number" value={formData.project["trees-shrubs"].numTrees} onChange={(e) => updateProjectField("trees-shrubs", "numTrees", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Number of Shrubs</label>
                    <input type="number" value={formData.project["trees-shrubs"].numShrubs} onChange={(e) => updateProjectField("trees-shrubs", "numShrubs", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Tree Size (caliper)</label>
                      <select value={formData.project["trees-shrubs"].treeSize} onChange={(e) => updateProjectField("trees-shrubs", "treeSize", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                        <option value="">Select size</option>
                        <option value="1-2in">1-2&quot; caliper</option>
                        <option value="2-3in">2-3&quot; caliper</option>
                        <option value="3-4in">3-4&quot; caliper</option>
                        <option value="4-6in">4-6&quot; caliper</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Shrub Size (height)</label>
                      <select value={formData.project["trees-shrubs"].shrubSize} onChange={(e) => updateProjectField("trees-shrubs", "shrubSize", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                        <option value="">Select size</option>
                        <option value="18-24in">#1 (18-24&quot;)</option>
                        <option value="24-36in">#2 (24-36&quot;)</option>
                        <option value="36-48in">#3 (36-48&quot;)</option>
                        <option value="48-60in">#5 (48-60&quot;)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Planting Purpose</label>
                    <select value={formData.project["trees-shrubs"].purpose} onChange={(e) => updateProjectField("trees-shrubs", "purpose", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl">
                      <option value="">Select purpose</option>
                      <option value="privacy">Privacy Screen</option>
                      <option value="ornamental">Ornamental</option>
                      <option value="foundation">Foundation Planting</option>
                      <option value="shade">Shade Trees</option>
                    </select>
                  </div>
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.project["trees-shrubs"].irrigation} onChange={(e) => updateProjectField("trees-shrubs", "irrigation", e.target.checked)} className="mr-2" />
                    <span className="text-sm font-bold text-gray-900">Include Drip Irrigation</span>
                  </label>
                </div>
              )}

           {/*      Conditional to change UI based on number of services selected         */}
            {selectedServices.length > 1 && ESTIMATE_SERVICE_KEYS.has(service.key) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h4 className="text-xl font-extrabold border-b-2 border-[#477a40] pb-2">{service.title} Instant Estimate</h4>
                  <button
                    type="button"
                    onClick={() => fetchSingleEstimate(service.key)}
                    className="rounded-xl bg-[#477a40] px-4 py-2 text-sm font-bold text-white hover:bg-[#3a6634] hover:cursor-pointer active:scale-95"
                  >
                    Calculate
                  </button>
                </div>

                {estimateErrors[service.key] && (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {estimateErrors[service.key]}
                  </p>
                )}

                {instantEstimates[service.key] && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subtotal</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatMoney(instantEstimates[service.key].subtotal, instantEstimates[service.key]?.currency || "CAD")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatMoney(instantEstimates[service.key].tax, instantEstimates[service.key]?.currency || "CAD")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                        <p className="text-lg font-bold text-[#477a40]">
                          {formatMoney(instantEstimates[service.key].total, instantEstimates[service.key]?.currency || "CAD")}
                        </p>
                      </div>
                    </div>

                    {Array.isArray(instantEstimates[service.key].lineItems) && 
                    instantEstimates[service.key].lineItems.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="mb-2 text-sm font-bold text-gray-900">Line Items</p>
                        <ul className="space-y-1 text-sm text-gray-700 max-h-48 overflow-y-auto">
                          {instantEstimates[service.key].lineItems.map((item, idx) => (
                            <li key={`${service.key}-${item.label}-${idx}`} className="flex items-center justify-between gap-3 py-1 border-b border-gray-100 last:border-b-0">
                              <span className="truncate">{item.label}</span>
                              <span className="font-semibold text-gray-900 min-w-[80px] text-right">
                                {formatMoney(item.total, instantEstimates[service.key].currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
  </section>
))}


{/* {selectedServices.length === 1 && ESTIMATE_SERVICE_KEYS.has(service.key) && ( )} */}

  
{selectedServices.length === 1 && ESTIMATE_SERVICE_KEYS.has(selectedServices[0].key) && (
<section key={selectedServices[0].key} className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2">
        {selectedServices[0].title} Instant Estimate
      </h3>
      <button
        type="button"
        onClick={() => fetchSingleEstimate(selectedServices[0].key)}
        disabled={isCalculating}
        className="rounded-xl bg-[#477a40] px-4 py-2 text-sm font-bold text-white hover:bg-[#3a6634] hover:cursor-pointer active:scale-95 disabled:opacity-60"
      >
        Calculate Estimate
      </button>
    </div>

    {estimateErrors[selectedServices[0].key] && (
      <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {estimateErrors[selectedServices[0].key]}
      </p>
    )}

    {instantEstimates[selectedServices[0].key] && (
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subtotal</p>
            <p className="text-lg font-extrabold text-gray-900">
              {formatMoney(instantEstimates[selectedServices[0].key].subtotal, instantEstimates[selectedServices[0].key]?.currency || "CAD")}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax</p>
            <p className="text-lg font-extrabold text-gray-900">
              {formatMoney(instantEstimates[selectedServices[0].key].tax, instantEstimates[selectedServices[0].key]?.currency || "CAD")}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
            <p className="text-lg font-extrabold text-[#477a40]">
              {formatMoney(instantEstimates[selectedServices[0].key].total, instantEstimates[selectedServices[0].key]?.currency || "CAD")}
            </p>
          </div>
        </div>

        {Array.isArray(instantEstimates[selectedServices[0].key].lineItems) && 
         instantEstimates[selectedServices[0].key].lineItems.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-sm font-bold text-gray-900">Line Items</p>
            <ul className="space-y-1 text-sm text-gray-700 max-h-48 overflow-y-auto">
              {instantEstimates[selectedServices[0].key].lineItems.map((item, idx) => (
                <li key={`${selectedServices[0].key}-${item.label}-${idx}`} className="flex items-center justify-between gap-3 py-1 border-b border-gray-100 last:border-b-0">
                  <span className="truncate">{item.label}</span>
                  <span className="font-semibold text-gray-900 min-w-[80px] text-right">
                    {formatMoney(item.total, instantEstimates[selectedServices[0].key].currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
</section>
)}


          {/* File upload - shared to resend email template*/}
          <section className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
            <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2 mb-6">Optional Media</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#477a40] transition-all">
              <input type="file" multiple accept="image/*,.pdf" onChange={(e) => setFormData({ ...formData, files: Array.from(e.target.files) })} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer p-4">
                <p className="text-lg font-bold text-gray-600">Drag photos/PDFs (design or house RPR) or click to upload</p>
                <p className="text-sm text-gray-500 mt-1">Up to 5 files</p>
              </label>
              {formData.files.length > 0 && <p className="mt-4 text-sm font-bold text-[#477a40]">{formData.files.length} files selected</p>}
            </div>
          </section>

          {/* Calculate All Button Will be replaced with a project total estimate section - rmeoved */}
          {selectedServices.length > 1 && selectedServices.some(s => ESTIMATE_SERVICE_KEYS.has(s.key)) && (
            <section className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2">Project Summary</h3>
                <button
                  type="button"
                  onClick={handleEstimatePreview}
                  disabled={isCalculating}
                  className="rounded-xl bg-[#477a40] px-4 py-2 text-sm font-bold text-white active:scale-95 hover:bg-[#3a6634] disabled:opacity-60 hover:cursor-pointer"
                >
                  {isCalculating ? "Calculating..." : `Calculate All (${selectedServices.filter(s => ESTIMATE_SERVICE_KEYS.has(s.key)).length})`}
                </button>
              </div>

              {selectedServices.filter(s => ESTIMATE_SERVICE_KEYS.has(s.key)).length === 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  Instant estimates available for Fence, Deck & Railing, Pergola, Sod, and Trees & Shrubs.
                </p>
              )}

              {Object.values(estimateErrors).some(error => error) && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Some estimates unavailable. Check individual service calculators above.
                </p>
              )}

              {/* Show grand total when ALL estimates loaded */}
              {selectedServices.filter(s => ESTIMATE_SERVICE_KEYS.has(s.key)).every(s => instantEstimates[s.key]) && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project Subtotal</p>
                      <p className="text-lg font-extrabold text-gray-900">
                        {formatMoney(
                          Object.values(instantEstimates).reduce((sum, est) => sum + (est.subtotal || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax</p>
                      <p className="text-lg font-extrabold text-gray-900">
                        {formatMoney(
                          Object.values(instantEstimates).reduce((sum, est) => sum + (est.tax || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                      <p className="text-lg font-extrabold text-[#477a40]">
                        {formatMoney(
                          Object.values(instantEstimates).reduce((sum, est) => sum + (est.total || 0), 0)
                        )}
                      </p>
                    </div>
                  </div>

                  {Object.values(instantEstimates).some(est => Array.isArray(est.lineItems) && est.lineItems.length > 0) && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h4 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Service Breakdown</h4>
                      <div className="space-y-2">
                        {selectedServices.map(service => instantEstimates[service.key] && (
                          <div key={service.key} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0">
                            <span className="font-medium text-gray-900">{service.title}</span>
                            <span className="font-bold text-[#477a40]">
                              {formatMoney(instantEstimates[service.key].total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}


          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center text-center max-h-17 rounded-2xl bg-[#477a40] px-8 py-10 sm:py-6 text-xl font-bold text-white hover:cursor-pointer hover:bg-white hover:border-[#477A40] hover:text-[#477A40] hover:scale-105 hover:border-2 active:scale-95 shadow-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : `${selectedServices.length > 1 ? `Send Estimate Request for ${selectedServices.length} Services` : 'Send Estimate Request'}`}
          </button>
        </form>
      </main>

      {showSuccess && (
        <QuoteSuccessModal open={true} onClose={() => {setShowSuccess(false); resetForm();}} message={summary} />
      )}
    </div>
  );
}

 


// ====================================     DO NOT SYNC TO MAIN OR PULL FROM MAIN REPO!!!!!   =========================================

//                                          DO NOT COMMIT THIS FILE TO GITHUB PUBLIC REPO!!!!!




