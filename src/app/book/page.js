"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

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


export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("service");
  const serviceFromUrl = searchParams.get("service");
  const [form, setForm] = useState({service: "",});
  const selectedService = useMemo(
      () => SERVICES.find((s) => s.id === serviceId) || null,
      [serviceId]
    );

  return (
    <div>
      <header>
        <NavBar />
      </header>

      <div className="booking-page">
      <main className="booking-layout">
        {/* left panel // business info */}
          <section className="booking-left">
                    <header className="select-a-service">
                        Select a service
                    </header>
          <section className="booking-left">
                <div className="step-card step-card--active">
                    <div className="step-card-header">
                      <h2 className="step-card-title">Selected service</h2>
                      <span className="step-card-status">Current step</span>
                    </div>
                    <p className="step-card-text">
                    {selectedService ? selectedService.name : "No service selected"}
                    {selectedService && (
                        <>
                        <br />
                        <span className="step-card-sub">
                            Duration: {selectedService.duration}
                        </span>
                        </>
                    )}
                    </p>
                </div>

          <div className="step-card step-card">
            <div className="step-card-header">
              <h2 className="step-card-title">Appointment time</h2>
            </div>
            <p className="step-card-text">
              Pick a date and an available time slot.
            </p>
          </div>

          <div className="step-card">
            <h2 className="step-card-title">Enter your details</h2>
            <p className="step-card-text">
              Next, you’ll add your contact info and project address.
            </p>
          </div>
        </section>
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
              Email: landscapecraftsmen@yahoo.com
              <br />
              Phone: (587)-438-6672
            </p>
          </div>
        </section>

        {/* right panel // services list */}
        <section className="booking-right">
          <h1 className="booking-title">Book an appointment</h1>

          <div className="booking-tabs">
            <button className="booking-tab booking-tab--active">Services</button>
          </div>

          <div className="service-list">
            {SERVICES.map((service) => (
              <Link
                key={service.id}
                href={`/book/time?service=${service.id}`}
                className="service-card-link"
              >
                <article className="service-card">
                  <div className="service-card-content">
                    <div className="service-card-text">
                      <h3 className="service-card-title">{service.name}</h3>
                      <p className="service-card-description">
                        {service.description}
                      </p>
                      <p className="service-card-meta">{service.meta}</p>
                    </div>

                    <div className="service-card-chevron">›</div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
    </div>
  );
}
