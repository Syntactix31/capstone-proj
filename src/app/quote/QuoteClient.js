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

  // Form state - unchanged structure
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [summary, setSummary] = useState("");
  const [instantEstimates, setInstantEstimates] = useState({}); // Changed to object: {fence: estimate, sod: estimate}
  const [estimateErrors, setEstimateErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.client.name) newErrors.clientName = "Required";
    if (!formData.client.email) newErrors.clientEmail = "Required";
    if (!formData.client.phone) newErrors.client_phone = "Required";
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

  // Fetch estimates for ALL selected services
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
    setIsSubmitting(true);
    try {
      await fetchInstantEstimates();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Get all estimates if not already loaded
      await fetchInstantEstimates();

      // Build HTML tables for each service
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
            <img src="https://scontent.fyyc2-1.fna.fbcdn.net/v/t39.30808-6/492498142_122104359134841590_6452344028794744127_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=2jCzUB78h3gQ7kNvwHIaWH3&_nc_oc=AdmHrrQZmAy0lo2w7Ngee7oxcedxT30nXsxCTtRUtBD2RgQHF0UF3s3eArYhkhM03YzF7HNn_VMFt1pyfvJVQfYo&_nc_zt=23&_nc_ht=scontent.fyyc2-1.fna&_nc_gid=g-SJa0Qr9HYeBg_-KBdojw&_nc_ss=8&oh=00_Afw8ZV_qWzCt3YNkYywhhqtExkYxNGj7m24PmeXPWNnDkw&oe=69AD99B5" style="height:40px;vertical-align:middle;margin-right:8px;">
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
            href="/services" 
            className="rounded-2xl bg-[#477a40] px-8 py-4 text-lg font-bold text-white hover:bg-white hover:border-[#477A40] hover:text-[#477A40] hover:scale-105 hover:border-2 transition-all shadow-lg"
          >
            Select Services First →
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
                  value={formData.client.name}
                  onChange={(e) => setFormData({ ...formData, client: { ...formData.client, name: e.target.value } })}
                  className="w-full p-4 border border-gray-300 rounded-xl"
                  required
                />
                {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Email *</label>
                <input 
                  type="email" 
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
                  value={formData.client.address} 
                  onChange={(e) => setFormData({ ...formData, client: { ...formData.client, address: e.target.value } })} 
                  className="w-full p-4 border border-gray-300 rounded-xl" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number *</label>
                <input 
                  type="tel" 
                  value={formData.client.phone} 
                  onChange={(e) => setFormData({ ...formData, client: { ...formData.client, phone: e.target.value } })} 
                  className="w-full p-4 border border-gray-300 rounded-xl" 
                  required
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

              {/* Per-service estimate preview */}
              {ESTIMATE_SERVICE_KEYS.has(service.key) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-[#477a40]">{service.title} Estimate</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const payload = buildEstimatePayload(service.key);
                        if (payload) fetch("/api/estimate", { /* ... */ }); // Single service calc
                      }}
                      className="text-sm bg-[#477a40]/20 hover:bg-[#477a40]/30 px-3 py-1 rounded-lg text-[#477a40] font-medium"
                    >
                      Calculate
                    </button>
                  </div>
                  {estimateErrors[service.key] && (
                    <p className="text-sm text-red-600 mb-3">{estimateErrors[service.key]}</p>
                  )}
                  {instantEstimates[service.key] && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-gray-500 uppercase">Subtotal</p>
                        <p className="font-bold">{formatMoney(instantEstimates[service.key].subtotal)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-gray-500 uppercase">Tax</p>
                        <p className="font-bold">{formatMoney(instantEstimates[service.key].tax)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-gray-500 uppercase">Total</p>
                        <p className="font-bold text-[#477a40] text-lg">{formatMoney(instantEstimates[service.key].total)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
          
          {/* File Upload - Shared */}
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

          {/* Calculate All Button */}
          {selectedServices.some(s => ESTIMATE_SERVICE_KEYS.has(s.key)) && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleEstimatePreview}
                disabled={isSubmitting}
                className="rounded-xl bg-[#477a40] px-8 py-3 text-base font-bold text-white hover:bg-[#3a6634] disabled:opacity-60 mb-6"
              >
                {isSubmitting ? "Calculating..." : `Calculate All Estimates (${selectedServices.filter(s => ESTIMATE_SERVICE_KEYS.has(s.key)).length})`}
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#477a40] px-8 py-4 text-xl font-bold text-white hover:bg-white hover:border-[#477A40] hover:text-[#477A40] hover:scale-105 hover:border-2 transition-all shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : `Send Estimate Request for ${selectedServices.length} Service${selectedServices.length > 1 ? 's' : ''}`}
          </button>
        </form>
      </main>

      {showSuccess && (
        <QuoteSuccessModal open={true} onClose={() => {setShowSuccess(false); resetForm();}} message={summary} />
      )}
    </div>
  );
}
