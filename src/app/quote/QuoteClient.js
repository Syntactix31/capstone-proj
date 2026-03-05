// NOTE: AI revisions to original estimate page on prototype (design non-autonomous):

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
// Switching to resend.js
// import emailjs from "@emailjs/browser";

// import NavBar from "../components/Navbar.js";
// import Footer from "../components/Footer.js";
import QuoteSuccessModal from "../components/QuoteSuccessModal.js"; 

const ESTIMATE_SERVICE_KEYS = new Set(["fence", "deck", "pergola", "sod", "trees-shrubs"]);

export default function QuoteClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceSlug = searchParams.get("service") || "";

  const services = {
    fence: { title: "Fence", key: "fence" },
    "deck-railing": { title: "Deck & Railing", key: "deck" },
    pergola: { title: "Pergola", key: "pergola" },
    sod: { title: "Sod", key: "sod" },
    "trees-shrubs": { title: "Trees & Shrubs", key: "trees-shrubs" },
  };

  const selectedService = services[serviceSlug] || null;

  // Form state (double check trees-shrubs string variable is permissible)
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
  const [instantEstimate, setInstantEstimate] = useState(null);
  const [estimateError, setEstimateError] = useState("");

  // useEffect(() => {
  //   emailjs.init("VYdNBLKU2JIYKKcva");
  // }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.client.name) newErrors.clientName = "Required";
    if (!formData.client.email) newErrors.clientEmail = "Required";
    if (!formData.client.phone) newErrors.client_phone = "Required";
    if (!selectedService) newErrors.service = "Select a service first";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const formatMoney = (value, currency = "CAD") =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
 
  const buildEstimatePayload = () => {
    if (!selectedService || !ESTIMATE_SERVICE_KEYS.has(selectedService.key)) return null;
    const claim = {
      name: formData.client.name,
      address: formData.client.address,
      email: formData.client.email,
      phone: formData.client.phone,
    };
    if (selectedService.key === "fence") {
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
    if (selectedService.key === "deck") {
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
  };

  // Change this to allow pergola and sod and trees and shrubs
  const fetchInstantEstimate = async () => {
    const payload = buildEstimatePayload();
    if (!payload) {
      setInstantEstimate(null);
      setEstimateError("Instant estimate is currently available only for Fence, Deck & Railing, and Pergola.");
      return null;
    }
    const res = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const details = Array.isArray(data?.details) ? data.details.join(" ") : data?.error || "Estimate unavailable.";
      setInstantEstimate(null);
      setEstimateError(details);
      throw new Error(details);
    }
    setEstimateError("");
    setInstantEstimate(data);
    return data;
  };
 
  const handleEstimatePreview = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await fetchInstantEstimate();
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
    const project = formData.project[selectedService.key];
    let estimate = instantEstimate;
    if (ESTIMATE_SERVICE_KEYS.has(selectedService.key) && !estimate) {
      try {
        estimate = await fetchInstantEstimate();
      } catch (estimateErr) {
        console.error("Estimate preview failed:", estimateErr);
      }
    }


  const projectFieldsHTML = Object.entries(project)
    .map(([key, value]) => {
      // Proper formatting for each data row (replaces redundant styling)
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

    const formatPhoneNumber = (phone) => {
      if (!phone) return "-";
      const digits = phone.replace(/\D/g, '');
      
      // String formatting fml
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

          <h3 style="border-bottom:2px solid #458500;margin-top:16px;padding-bottom:4px;">Project Details</h3>
          <table style="width:100%;border-collapse:collapse;">${projectFieldsHTML}</table>

          ${
            estimate
              ? `<h3 style="border-bottom:2px solid #458500;margin-top:16px;padding-bottom:4px;">Instant Estimate (Preliminary)</h3>
                 <table style="width:100%;border-collapse:collapse;">
                   <tr><td><strong>Subtotal:</strong></td><td>${formatMoney(estimate.subtotal, estimate.currency)}</td></tr>
                   <tr><td><strong>Tax:</strong></td><td>${formatMoney(estimate.tax, estimate.currency)}</td></tr>
                   <tr><td><strong>Total:</strong></td><td><strong>${formatMoney(estimate.total, estimate.currency)}</strong></td></tr>
                 </table>`
              : ""
          }

          ${formData.files.length > 0 ? `
            <h4 style="margin-top:16px;">Uploaded Files</h4>
            <p>${formData.files.map((f) => f.name).join(", ")}</p>
          ` : ""}

        </div>
      </div>
    `;

    // File handling for uploading attached files to email
    const attachments =
      formData.files.length > 0
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
        to_email: formData.client.email, // replace with landscapecraftsmen@yahoo.com when client approves (help him get set up with resend API)
        subject: `New Estimate Request: ${selectedService.title}`,
        message_html: messageHTML,
        attachments,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Backend response:", errText);
      throw new Error("Send failed");
    }

    const estimateSummary = estimate
      ? ` Instant estimate: ${formatMoney(estimate.total, estimate.currency)} (${estimate.currency}).`
      : "";
    setSummary(`Thanks ${formData.client.name}! Details sent to our team for quoting.`);
    setShowSuccess(true);
  } catch (err) {
    console.error(err);
    alert("Send failed—try again or contact us.");
  } finally {
    setIsSubmitting(false);
  }
};


      // ======== IMPORTANT DO NOT FORGET ===========
      // Prepare email params (to business: landscapecraftsmen@yahoo.com)
      // Pre production deployment using my personal email (so owner email not spammed during integration tests)


        // ===== IMPORTANT =====
        // Research free API endpoints for image and file uploading over email
        // Files handled separately or via FormData if using API route




// ***** Keeping the following for reference as previous API call using email.js *****

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!validateForm()) return;

  //   setIsSubmitting(true);
  //   try {

  //     const project = formData.project[selectedService.key];

  //     //NOTE: moved email.js html formatting here because of subscription limits
  //     const projectFieldsHTML = Object.entries(project)
  //       .map(([key, value]) => {
  //         if (typeof value === "boolean") {
  //           return `<tr><td><b>${key}</b></td><td>${value ? "Yes" : "No"}</td></tr>`;
  //         }
  //         return `<tr><td><b>${key}</b></td><td>${value || "-"}</td></tr>`;
  //       })
  //       .join("");

  //     // format details for business email 
  //     const messageHTML = `
  //     <div style="max-width:600px;margin:auto;background:#fff;font-family:arial,sans-serif;color:#333;">
  //       <div style="border-top:6px solid #458500;padding:16px;">
  //         <img src="https://instagram.fyyc2-1.fna.fbcdn.net/v/t51.2885-19/439888727_2630358303796612_1490803132265581090_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fyyc2-1.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2QHbmTjNQN3moW6zr59MJIdJLHpe1_4mPLqRUoLWZbLhKc3yFdYI9Sjy5Elzq_tjTpXasTqqbpfNnYZIWT5bF3Vp&_nc_ohc=fm5v8pYLPAoQ7kNvwFUNekG&_nc_gid=aTA9-PZZAI4aoX12o7GEGQ&edm=APoiHPcBAAAA&ccb=7-5&oh=00_Afx8fXY4ryEFq1Prd342t7GQS5SlOC2KvZetUWhkpbJCKw&oe=69ABECF3&_nc_sid=22de04" style="height:40px;vertical-align:middle;margin-right:8px;">
  //         <a href="https://landscape-craftsmen.vercel.app/" style="text-decoration:none;font-weight:bold;color:#333;">Landscape Craftsmen</a>
  //         <span style="font-size:16px;vertical-align:middle;border-left:1px solid #333;padding-left:8px;"><strong>New Quote Request</strong></span>
  //       </div>

  //       <div style="padding:16px;">
  //         <p>You have received a new estimate request through your website.</p>
  //         <h3 style="border-bottom:2px solid #458500;padding-bottom:4px;">Client Information</h3>
  //         <table style="width:100%;border-collapse:collapse;">
  //           <tr><td><strong>Name:</strong></td><td>${formData.client.name}</td></tr>
  //           <tr><td><strong>Email:</strong></td><td>${formData.client.email}</td></tr>
  //           <tr><td><strong>Address:</strong></td><td>${formData.client.address || "-"}</td></tr>
  //           <tr><td><strong>Phone:</strong></td><td>${formData.client.phone}</td></tr>
  //         </table>

  //         <h3 style="border-bottom:2px solid #458500;margin-top:16px;padding-bottom:4px;">Project Details</h3>
  //         <table style="width:100%;border-collapse:collapse;">${projectFieldsHTML}</table>
  //         ${formData.files.length > 0 ? `<h4>Uploaded Files:</h4><ul>${formData.files.map(f => `<li>${f.name}</li>`).join("")}</ul>` : ""}

  //         <p style="margin-top:20px;font-size:12px;color:#999;">This email was automatically generated from your estimate request form.</p>
  //       </div>
  //     </div>
  //     `;

  //     // const templateParams = {

  //     //   to_email: "L3V1medal@gmail.com", 
  //     //   from_name: formData.client.name,
  //     //   from_email: formData.client.email,
  //     //   service: selectedService.title,
  //     //   message_html: messageHTML,
  //     // };


  //     const templateParams = {
  //       // to_email: "landscapecraftsmen@yahoo.com",
  //       to_email: "L3V1medal@gmail.com",
  //       from_name: formData.client.name,
  //       service: selectedService.title,
  //       client_name: formData.client.name,
  //       client_email: formData.client.email,
  //       client_phone: formData.client.phone,
  //       client_address: formData.client.address || "N/A",
  //       project_details: JSON.stringify(formData.project[selectedService.key], null, 2),
  //       message: messageHTML  // Use 'message' field
  //     };

  //     // const templateParams = {
  //     //   // to_email: "landscapecraftsmen@yahoo.com",
  //     //   to_email: "L3V1medal@gmail.com", 
  //     //   service: selectedService.title,
  //     //   client_name: formData.client.name,
  //     //   client_address: formData.client.address,
  //     //   client_email: formData.client.email,
  //     //   client_phone: formData.client.phone,
  //     //   project_details: JSON.stringify(formData.project[selectedService.key], null, 2),

  //     // };

  //     await emailjs.send("service_my1ew5p", "template_blank", {
  //       to_email: "L3V1medal@gmail.com",
  //       message_html: messageHTML,
  //     });

  //     // await emailjs.send("service_my1ew5p", "template_ygvpo45", templateParams);

  
  //     setSummary(`Thanks ${formData.client.name}! Details sent to our team for quoting.`);
  //     setShowSuccess(true);
  //   } catch (err) {
  //     alert("Send failed—try again or contact us.");
  //   }
  //   setIsSubmitting(false);
  // };


  // Resets all inputs after submission
  const resetForm = () => {
    setFormData({
      client: { name: "", address: "", email: "", phone: "" },
      project: {
        fence: { gates: "", linearFt: "", height: "4'", postSize: "4x4", pressureTreated: false },
        deck: { length: "", width: "", height: "", railing: "none" },
        pergola: { length: "", width: "", height: "" },
        sod: { squareFt: "", length: "", width: "", condition: "", gradingNeeded: false },
        "trees-shrubs": {
          numTrees: "",
          numShrubs: "",
          treeSize: "",
          shrubSize: "",
          purpose: "",
          irrigation: false,
        },
      },
      files: [],
    });
  };


  const updateProjectField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      project: {
        ...prev.project,
        [selectedService?.key]: { ...prev.project[selectedService?.key], [field]: value }
      }
    }));
  };

  // Temp screen so the flow from the selected services page is better (it doesn't require unnecessary duplicated input)
  if (!selectedService) {
    return (
      <div className="overflow-hidden bg-white min-h-screen flex flex-col">
        <header className="shrink-0">
          {/* <NavBar /> */}
        </header>
        <main className="flex-1 flex items-center justify-center px-4 -mt-35">
          <Link 
            href="/services" 
            className="rounded-2xl bg-[#477a40] px-8 py-4 text-lg font-bold text-white hover:bg-white hover:border-[#477A40] hover:text-[#477A40] hover:scale-105 hover:border-2 transition-all shadow-lg"
          >
            Select a Service First →
          </Link>
        </main>
        <footer className="shrink-0 mt-auto">
          {/* <Footer /> */}
        </footer>
      </div>
    );

  }

  return (
    <div className="overflow-hidden bg-white min-h-screen flex flex-col">
      {/* <header className="flex w-full bg-white"><NavBar /></header> */}

      <main className="flex-1 flex flex-col justify-start px-4 pb-12">
        <div className="w-full mx-auto max-w-6xl px-4 mt-12">
          <h2 className="mx-auto w-fit text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">
            Free Estimate: {selectedService.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="w-full mx-auto max-w-2xl px-4 mt-8 space-y-8">
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
                <input type="email" value={formData.client.email} onChange={(e) => setFormData({ ...formData, client: { ...formData.client, email: e.target.value } })} className="w-full p-4 border border-gray-300 rounded-xl" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Home Address</label>
                <input type="text" value={formData.client.address} onChange={(e) => setFormData({ ...formData, client: { ...formData.client, address: e.target.value } })} className="w-full p-4 border border-gray-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number</label>
                <input type="tel" value={formData.client.phone} onChange={(e) => setFormData({ ...formData, client: { ...formData.client, phone: e.target.value } })} className="w-full p-4 border border-gray-300 rounded-xl" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
            <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2 mb-6">Project Details</h3>
            
            {selectedService.key === "fence" && (
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
            
            {selectedService.key === "deck" && (
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
            
            {selectedService.key === "pergola" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-bold mb-2">Length (ft)</label><input type="number" value={formData.project.pergola.length} onChange={(e) => updateProjectField("pergola", "length", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" /></div>
                <div><label className="block text-sm font-bold mb-2">Width (ft)</label><input type="number" value={formData.project.pergola.width} onChange={(e) => updateProjectField("pergola", "width", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" /></div>
                <div><label className="block text-sm font-bold mb-2">Height (ft)</label><input type="number" value={formData.project.pergola.height} onChange={(e) => updateProjectField("pergola", "height", e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl" /></div>
              </div>
            )}
            
            {selectedService.key === "sod" && (
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
            
            {selectedService.key === "trees-shrubs" && (
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
          </section>


          <section className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-2xl font-extrabold border-b-2 border-[#477a40] pb-2">Instant Estimate</h3>
              {ESTIMATE_SERVICE_KEYS.has(selectedService.key) && (
                <button
                  type="button"
                  onClick={handleEstimatePreview}
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#477a40] px-4 py-2 text-sm font-bold text-white hover:bg-[#3a6634] disabled:opacity-60"
                >
                  {isSubmitting ? "Calculating..." : "Calculate Estimate"}
                </button>
              )}
            </div>
 
            {!ESTIMATE_SERVICE_KEYS.has(selectedService.key) && (
              <p className="mt-3 text-sm text-gray-600">
                Instant estimate is currently available for Fence, Deck & Railing, and Pergola only.
              </p>
            )}
 
            {estimateError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {estimateError}
              </p>
            )}
 
            {instantEstimate && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subtotal</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      {formatMoney(instantEstimate.subtotal, instantEstimate.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      {formatMoney(instantEstimate.tax, instantEstimate.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                    <p className="text-lg font-extrabold text-[#477a40]">
                      {formatMoney(instantEstimate.total, instantEstimate.currency)}
                    </p>
                  </div>
                </div>
                {Array.isArray(instantEstimate.lineItems) && instantEstimate.lineItems.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-gray-900">Line Items</p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {instantEstimate.lineItems.map((item, idx) => (
                        <li key={`${item.label}-${idx}`} className="flex items-center justify-between gap-3">
                          <span>{item.label}</span>
                          <span className="font-semibold">
                            {formatMoney(item.total, instantEstimate.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>


          {/* Media Upload */}
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

          {/* Optional to add the flex-1 on the submit button if formatting changes */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center text-center max-h-15 rounded-2xl bg-[#477a40] px-8 py-4 text-xl font-bold text-white hover:cursor-pointer hover:bg-white hover:border-[#477A40] hover:text-[#477A40] hover:scale-105 hover:border-2 active:scale-95 shadow-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Estimate Request"}
          </button>
        </form>
      </main>

      {showSuccess && (
        <QuoteSuccessModal open={true} onClose={() => {setShowSuccess(false); resetForm();}} message={summary} />
      )}

      {/* <Footer /> */}
    </div>
  );
}





/**   ******** TODO **********
 * Change the focus border on all the input fields from black to the theme colour [#477a40]
 * 
 * 
 * =====  For Adlin ===== 
 * 
 * Add file upload to email API send stream byte conversions
 * Format measurements to email template (ln/ft, ft, sq/ft)
 * 
 */


