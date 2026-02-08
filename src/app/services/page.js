"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function Services() {
  const [selectedSlug, setSelectedSlug] = useState(null);

  const services = [
    {
      slug: "fence",
      title: "Fence",
      description:
        "Professional fence installation using pressure-treated or composite materials.rable, professionally installed fencing to improve privacy, security, and curb appeal with clean lines and solid posts.",
    },
    {
      slug: "deck-railing",
      title: "Deck & railing",
      description:
        "Custom decks built for comfort and longevity, paired with sturdy railings that meet code and match your home’s style.",
    },
    {
      slug: "pergola",
      title: "Pergola",
      description:
        "A clean, modern pergola that adds shade, structure, and a standout feature to your backyard or patio space.",
    },
    {
      slug: "sod",
      title: "Sod",
      description:
        "Fresh sod laid and graded properly for a smooth, green lawn with strong root take and a clean finish.",
    },
    {
      slug: "trees-shrubs",
      title: "Trees & Shrubs",
      description:
        "Thoughtful planting of trees and shrubs for privacy, landscaping design, and low-maintenance greenery that grows well in your yard.",
    },
  ];

  const selectedService = useMemo(
    () => services.find((s) => s.slug === selectedSlug) || null,
    [selectedSlug]
  );

  const toggleSelect = (slug) => {
    setSelectedSlug((prev) => (prev === slug ? null : slug));
  };

  return (
    <div className={`overflow-hidden bg-white ${selectedSlug ? "pb-28" : ""}`}>
      <header className="flex w-full bg-white">
        <NavBar />
      </header>

      <main className="flex min-h-screen w-full flex-col bg-white">
        {/* SERVICES GRID */}
        <div className="w-full mx-auto max-w-6xl px-4 mt-12">
          <h2 className="mx-auto w-fit text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">
            Choose a Service
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => {
              const isSelected = selectedSlug === service.slug;

              return (
                <button
                  key={service.slug}
                  type="button"
                  onClick={() => toggleSelect(service.slug)}
                  onMouseDown={(e) => e.preventDefault()} // prevents double-click text select on web
                  className={[
                    "select-none text-left rounded-xl border p-6 shadow-sm transition-all duration-200 active:scale-[0.99]",
                    "bg-white border-[#477a40]/20 hover:shadow-lg",
                    isSelected
                      ? "ring-2 ring-[#477a40] bg-[#477a40]/5"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-extrabold text-gray-900">
                      {service.title}
                    </h3>

                    <span
                      className={[
                        "shrink-0 rounded-full px-3 py-1 text-xs font-extrabold",
                        isSelected
                          ? "bg-[#477a40] text-white"
                          : "bg-[#477a40]/10 text-[#2f5a29] border border-[#477a40]/20",
                      ].join(" ")}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </div>

                  <p className="mt-3 text-base leading-relaxed text-gray-600">
                    {service.description}
                  </p>

                  <p className="mt-4 text-sm font-semibold text-gray-500">
                    Materials included where applicable
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-14">
          <Footer />
        </div>
      </main>

      {/* BOTTOM ACTION BAR */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-50",
          "bg-white/90 backdrop-blur border-t border-black/10",
          "transition-all duration-200 ease-out",
          selectedSlug
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="w-full mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="select-none">
            <p className="text-sm font-extrabold text-gray-900">
              {selectedService ? `${selectedService.title} is selected` : ""}
            </p>
            <p className="text-xs font-semibold text-gray-600">
              Tap another service to change, or tap the same one to unselect.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={selectedSlug ? `/book/time?service=${selectedSlug}` : "/book"}
              className="rounded-2xl bg-[#477a40] px-5 py-3 text-sm font-bold text-white hover:cursor-pointer border-2 border-transparent hover:bg-[#f3fff3] hover:border-[#477A40] hover:text-[#477A40] transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl"
            >
              Book Now
            </Link>

            <Link
              href={selectedSlug ? `/quote?service=${selectedSlug}` : "/quote"}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#477a40] border-2 border-[#477A40] hover:bg-[#f3fff3] transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl"
            >
              Get Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
