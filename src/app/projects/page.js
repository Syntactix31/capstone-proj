"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";



const media = [
  { type: "image", src: "/projects/0ca9cee4-984b-4379-9e97-339140fcc257.JPG" },
  { type: "image", src: "/projects/2e084da0-0d96-44f0-a943-3f9080bd1191.JPG" },
  { type: "image", src: "/projects/9a8bb317-ee87-4071-bcd1-9d7ac9690ccc.JPG" },
  { type: "image", src: "/projects/9e2d7e4d-d537-4324-8291-a7169bd60fe9.JPG" },
  { type: "video", src: "/projects/test2.mp4", poster: "/projects/test2.webp" },
  { type: "video", src: "/projects/test.mp4", poster: "/projects/test.jpg" },
  { type: "image", src: "/projects/84c75c6b-235f-4ed9-811f-9e8b2c601b90.JPG" },
  { type: "image", src: "/projects/129d5c82-ea89-4650-b3a6-a40563e53dda.JPG" },
  { type: "image", src: "/projects/287a6cb6-1d45-4f5b-8a47-d50d2f87a58b.JPG" },
  { type: "image", src: "/projects/590baa48-c0b6-43b4-8f03-1abf3a710295.JPG" },
  { type: "image", src: "/projects/881a60f4-b7f6-4fea-a8ad-667abcead1e0.JPG" },
  { type: "image", src: "/projects/6124ded5-f2e1-49de-b1dd-8c593cd53aaf.JPG" },
];

// 12 “Figma slots” using 12-col grid.
// Each item = { c: columnSpan, r: rowSpan }
const layout = [
  { c: 3, r: 7 }, // tall left
  { c: 6, r: 4 }, // big top center
  { c: 3, r: 7 }, // tall right
  { c: 6, r: 3 }, // mid center
  { c: 6, r: 3 }, // bottom center
  { c: 6, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 6, r: 3 },
  { c: 6, r: 3 },
  { c: 12, r: 3 }
];

function Tile({ src, type, poster, span, onClick, priority }) {
  return (
    <button
      type="button"
      className="tile relative overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-105"
      onClick={onClick}
      style={{
        gridColumn: `span ${span.c}`,
        gridRow: `span ${span.r}`
      }}
      aria-label="View project media"
    >
      {type === "image" ? (
      <Image
        src={src}
        alt="Project image"
        fill
        priority={priority}
        quality={75}
        style={{ objectFit: "cover" }}
        sizes="(max-width: 900px) 100vw, 33vw"
      />
      ) : (
      <video
        muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          className="w-full h-full object-cover"
          onMouseEnter={(e) => {
            const v = e.currentTarget;
            if (v.paused) v.play().catch(() => {});
          }}
          onMouseLeave={(e) => {
            const v = e.currentTarget;
            v.pause();
            v.currentTime = 0;
            v.load();
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </button>
  );
}

export default function ProjectsPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const visibleMedia = media.slice(0, 12);
  const closeModal = () => setActiveIndex(null);

  const showPrev = () => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return (prev - 1 + visibleMedia.length) % visibleMedia.length;
    });
  };

  const showNext = () => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return (prev + 1) % visibleMedia.length;
    });
  };

  // Keyboard controls while modal is open
  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex]);
  
  return (
    <div className="projectsPage">
      <NavBar />

      <section className="w-full mx-auto max-w-6xl px-4 mt-10">
        <div className="relative overflow-hidden rounded-xl border border-[#477a40]/20 bg-linear-to-br from-[#477a40]/10 via-white to-white p-8 shadow-lg md:p-12">

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#477a40]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[#477a40]/10 blur-3xl" />

          <div className="relative text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              A Collection Of Our <br /> Finest Work.
            </h1>
          </div>
        </div>
      </section>
      <section className="projectsSection">
        <div className="collage">
          {visibleMedia.slice(0, 12).map((item, i) => (
            <Tile
              key={i}
              src={item.src}
              type={item.type}
              poster={item.poster}
              span={layout[i] || { c: 4, r: 3 }}
              onClick={() => setActiveIndex(i)}
              priority={i < 2} // helps the Next.js LCP warning 
            />
          ))}
        </div>
      </section>
            {/* ===== Modal / Lightbox ===== */}
      {activeIndex !== null && (
        <div
          className="lightboxOverlay"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div className="lightboxInner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightboxClose"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>

            <button
              type="button"
              className="lightboxNav lightboxLeft"
              onClick={showPrev}
              aria-label="Previous"
            >
              ‹
            </button>

            <div className="lightboxImageWrap" key={visibleMedia[activeIndex].src}>
              {visibleMedia[activeIndex].type === "image" ? (
                <Image
                  src={visibleMedia[activeIndex].src}
                  alt={`Project ${activeIndex + 1}`}
                  fill
                  quality={90}
                  style={{ objectFit: "contain" }}
                  sizes="100vw"
                  priority
                />
              ) : (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                  poster={visibleMedia[activeIndex].poster}
                >
                  <source src={visibleMedia[activeIndex].src} type="video/mp4" />
                </video>
              )}
            </div>

            <button
              type="button"
              className="lightboxNav lightboxRight"
              onClick={showNext}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}