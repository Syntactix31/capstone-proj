"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

// Media items: type = "image" | "video", src = file path, poster = video poster image
const media = [
  { type: "video", src: "/projects/Vid1.mp4", poster: "/projects/Post1.JPG" },
  { type: "video", src: "/projects/Vid2.mp4", poster: "/projects/Post2.JPG" },
  { type: "video", src: "/projects/Vid3.mp4", poster: "/projects/Post3.JPG" },
  { type: "video", src: "/projects/Vid4.mp4", poster: "/projects/Post4.JPG" },
  { type: "image", src: "/projects/Img18.JPG" },
  { type: "image", src: "/projects/Img2.JPG" },
  { type: "image", src: "/projects/Img3.JPG" },
  { type: "image", src: "/projects/Img4.JPG" },
  { type: "image", src: "/projects/Img11.JPG" },
  { type: "image", src: "/projects/Img6.JPG" },
  { type: "image", src: "/projects/Img7.JPG" },
  { type: "image", src: "/projects/Img8.JPG" },
  { type: "image", src: "/projects/Img12.JPG" },
  { type: "image", src: "/projects/Img10.JPG" },
  { type: "image", src: "/projects/Img5.JPG" },
  { type: "image", src: "/projects/Img9.JPG" },
  { type: "image", src: "/projects/Img13.JPG" },
  { type: "image", src: "/projects/Img14.JPG" },
  { type: "image", src: "/projects/Img15.JPG" },
  { type: "image", src: "/projects/Img19.JPG" },
  { type: "image", src: "/projects/Img17.JPG" },
  { type: "image", src: "/projects/Img1.JPG" },
  { type: "image", src: "/projects/Img16.JPG" }
];

// 23 “Figma slots” using 12-col grid.
// Each item = { c: columnSpan, r: rowSpan }
const layout = [
  { c: 4, r: 6 }, 
  { c: 4, r: 3 }, 
  { c: 4, r: 6 }, 
  { c: 4, r: 3 }, 
  { c: 6, r: 3 }, 
  { c: 6, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 6, r: 3 },
  { c: 6, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 6, r: 3 },
  { c: 6, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 12, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 }
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
        sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw"
      />
      ) : (
        <div className="videoTile">
          <video
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            className="absolute inset-0 w-full h-full object-cover"
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

          <div className="videoOverlay" aria-hidden="true">
            <div className="playBadge">▶</div>
            <div className="videoLabel">Video</div>
          </div>
        </div>
      )}
    </button>
  );
}

export default function ProjectsPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const visibleMedia = media.slice(0, 23);
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
        <div className="collageWrap">
          <div className="collage">
            {visibleMedia.slice(0, 23).map((item, i) => (
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

            <div className="lightboxMedia" key={visibleMedia[activeIndex].src}>
              {visibleMedia[activeIndex].type === "image" ? (
                <Image
                  src={visibleMedia[activeIndex].src}
                  alt={`Project ${activeIndex + 1}`}
                  fill
                  quality={90}
                  sizes="100vw"
                  priority
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <video
                  controls
                  autoPlay
                  playsInline
                  poster={visibleMedia[activeIndex].poster}
                  className="lightboxVideo"
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