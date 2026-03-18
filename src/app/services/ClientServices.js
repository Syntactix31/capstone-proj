"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Lets users pick one or more services before booking or requesting a quote.
export default function ClientServices() {
  const searchParams = useSearchParams();
  const initialServicesParam = searchParams.get("service");
  // Build the initial selected services list from the URL when arriving from a link.
  const initialSelected = useMemo(() => {
    if (!initialServicesParam) return [];
    return initialServicesParam.split(",").filter(Boolean);
  }, [initialServicesParam]);

  const [selectedSlugs, setSelectedSlugs] = useState(initialSelected);

  // Services shown as selectable cards on the page.
  const services = useMemo(() => [
    {
      slug: "fence",
      title: "Fence",
      description: "Professional fence installation using pressure-treated or composite materials.rable, professionally installed fencing to improve privacy, security, and curb appeal with clean lines and solid posts.",
    },
    {
      slug: "deck-railing",
      title: "Deck & Railing",
      description: "Custom decks built for comfort and longevity, paired with sturdy railings that meet code and match your home's style.",
    },
    {
      slug: "pergola",
      title: "Pergola",
      description: "A clean, modern pergola that adds shade, structure, and a standout feature to your backyard or patio space.",
    },
    {
      slug: "sod",
      title: "Sod",
      description: "Fresh sod laid and graded properly for a smooth, green lawn with strong root take and a clean finish.",
    },
    {
      slug: "trees-shrubs",
      title: "Trees & Shrubs",
      description: "Thoughtful planting of trees and shrubs for privacy, landscaping design, and low-maintenance greenery that grows well in your yard.",
    },
  ], []);

  // Add or remove one service from the current selection.
  const toggleSelect = useCallback((slug) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  }, []);

  // Carry the selected services forward into the booking and quote flows.
  const serviceUrls = useMemo(() => {
    const params = selectedSlugs.length > 0 
      ? `service=${selectedSlugs.join(",")}` 
      : "";
    return {
      book: params ? `/book/time?${params}` : "/book",
      quote: params ? `/quote?${params}` : "/quote"
    };
  }, [selectedSlugs]);

  const selectedCount = selectedSlugs.length;
  const selectedServices = useMemo(() => 
    services.filter(s => selectedSlugs.includes(s.slug)), 
    [selectedSlugs, services]
  );

  return (
    <>
      <div className="services-select-wrap">
        <div className="services-select-grid">
          {services.map((service) => {
            const isSelected = selectedSlugs.includes(service.slug);

            return (
              <button
                key={service.slug}
                type="button"
                onClick={() => toggleSelect(service.slug)}
                onMouseDown={(e) => e.preventDefault()}
                className={[
                  "service-select-card",
                  isSelected ? "is-selected" : "",
                ].join(" ")}
              >
                <div className="service-select-card__header">
                  <h3 className="service-select-card__title">
                    {service.title}
                  </h3>
                  <span
                    className={[
                      "service-select-card__badge",
                      isSelected
                        ? "is-selected"
                        : "is-unselected",
                    ].join(" ")}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </div>
                <p className="service-select-card__description">
                  {service.description}
                </p>
                <p className="service-select-card__meta">
                  Materials included where applicable
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={[
          "services-select-bar",
          selectedCount > 0
            ? "is-visible"
            : "is-hidden",
        ].join(" ")}
      >
        <div className="services-select-bar__inner">
          <div className="services-select-bar__copy">
            <p className="services-select-bar__title">
              {selectedCount > 0 
                ? `${selectedCount} service${selectedCount > 1 ? 's' : ''} selected: ${selectedServices.map(s => s.title).join(', ')}`
                : ""
              }
            </p>
            <p className="services-select-bar__text">
              Tap services to select/deselect. Book or get quote with multiple services selected.
            </p>
          </div>
          <div className="services-select-bar__actions">
            <Link
              href={serviceUrls.book}
              className="services-select-bar__button services-select-bar__button--primary"
            >
              Book Now
            </Link>
            <Link
              href={serviceUrls.quote}
              className="services-select-bar__button services-select-bar__button--secondary"
            >
              Get Quote
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

