// app/book/BookContent.jsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const SERVICES = [
  {
    id: "fence",
    name: "Fence Installation",
    description:
      "Professional fence installation to improve privacy, security, and curb appeal.",
  },
  {
    id: "deck-railing",
    name: "Deck & Railing",
    description:
      "Custom deck and railing built for durability, safety, and a clean finish.",
  },
  {
    id: "pergola",
    name: "Pergola",
    description:
      "A modern pergola that adds shade, structure, and a focal point to your yard.",
  },
  {
    id: "sod",
    name: "Sod Installation",
    description:
      "Fresh sod installed and leveled for a smooth, healthy-looking lawn.",
  },
  {
    id: "trees-shrubs",
    name: "Trees & Shrubs",
    description:
      "Planting and positioning of trees and shrubs for privacy and landscaping.",
  },
];

export function BookContent() {
  const searchParams = useSearchParams();

  const initialServicesParam = searchParams.get("service") || "";
  const initialSelectedIds = initialServicesParam
    ? initialServicesParam.split(",").filter(Boolean)
    : [];

  const [selectedServiceIds, setSelectedServiceIds] = useState(initialSelectedIds);

  const selectedServices = selectedServiceIds
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean);

  const handleServiceClick = (serviceId) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const servicesParam = selectedServiceIds.join(",");
  const timePageUrl = servicesParam
    ? `/book/time?service=${servicesParam}`
    : "/book/time";

  return (
    <div>
      <div className="booking-page">
        <main className="booking-layout">
          <section className="booking-left">
            <header className="select-a-service">Select service(s)</header>

            <div
              className={`step-card ${
                selectedServices.length > 0 ? "step-card--active" : ""
              }`}
            >
              <div className="step-card-header">
                <h2 className="step-card-title">Selected service(s)</h2>
                <span className="step-card-status">
                  {selectedServices.length > 0 ? "Current step" : ""}
                </span>
              </div>
              <p className="step-card-text">
                {selectedServices.length > 0
                  ? `${selectedServices.length} service(s) selected: ${selectedServices
                      .map((s) => s.name)
                      .join(", ")}`
                  : "No service selected yet. Pick services from the list on the right to continue."}
              </p>
            </div>

            <div className="step-card">
              <div className="step-card-header">
                <h2 className="step-card-title">Appointment time</h2>
              </div>
              <p className="step-card-text">
                Next, you&apos;ll pick a date and an available time slot.
              </p>
            </div>

            <div className="step-card">
              <h2 className="step-card-title">Enter your details</h2>
              <p className="step-card-text">
                Finally, you&apos;ll add your contact info and project address.
              </p>
            </div>

            <h1 className="business-name">Landscape Craftsmen</h1>

            <div className="booking-block">
              <h2 className="booking-block-title">Location</h2>
              <p className="booking-text">
                Calgary, AB, Canada
                <br />
                Serving surrounding areas.
              </p>
            </div>

            <div className="booking-block">
              <h2 className="booking-block-title">Contact</h2>
              <p className="booking-text">
                Email:{" "}
                <a href="mailto:landscapecraftsmen@yahoo.com">
                  landscapecraftsmen@yahoo.com
                </a>
                <br />
                Phone: (587)-438-6672
              </p>
            </div>
          </section>

          <section className="booking-right">
            <h1 className="booking-title">Book an appointment</h1>

            <div className="booking-tabs">
              <button className="booking-tab booking-tab--active">
                Services
              </button>
            </div>

            <div className="service-list">
              {SERVICES.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceClick(service.id)}
                    className={`service-card-link ${
                      isSelected ? "service-card-link--selected" : ""
                    }`}
                  >
                    <article
                      className={`service-card ${
                        isSelected ? "service-card--selected" : ""
                      }`}
                    >
                      <div className="service-card-content">
                        <div className="service-card-text">
                          <h3 className="service-card-title">{service.name}</h3>
                          <p className="service-card-description">
                            {service.description}
                          </p>
                          {isSelected && (
                            <span className="service-card-selected">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                        <div className="service-card-chevron">
                          {isSelected ? "✓" : ">"}
                        </div>
                      </div>
                    </article>
                  </button>
                );
              })}
            </div>

            {selectedServices.length > 0 && (
              <Link
                href={timePageUrl}
                className="mt-6 w-full inline-flex justify-center rounded-2xl bg-[#477a40] px-6 py-3 text-sm font-bold text-white hover:bg-[#3a5f32] transition-all duration-200"
              >
                Continue to Time Selection →
              </Link>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

