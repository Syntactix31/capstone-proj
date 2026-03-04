"use client";


import { useEffect, useState } from "react";
import Image from "next/image";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

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
  { c: 12, r: 3 },
];

function Tile({ src, type, poster, span, onClick, priority }) {
  return (
    <button
      type="button"
      className="relative overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-105"
      onClick={onClick}
      style={{
        gridColumn: `span ${span.c}`,
        gridRow: `span ${span.r}`,
      }}
    >
      {type === "image" ? (
        <Image
          src={src}
          alt="Project"
          fill
          priority={priority}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <video
          muted
          loop
          playsInline
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </button>
  );
}

export default function ProjectsPage(){
  const [mediaItems, setMediaItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Helper to fetch full folder
  const fetchMediaFolder = async () => {
    const res = await fetch("/api/ScanMedia");
    const data = await res.json();
    return data;
  };

  // Load folder on mount
  useEffect(() => {
    fetchMediaFolder().then(data => setMediaItems(data));
  }, []);

  // Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Upload file
    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    //detect if the uploaded file is a video and if so, create a poster image for it
    if (file.type === "video/mp4") {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.currentTime = 1; // Capture frame at 1 second
      video.addEventListener("loadeddata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          const posterFile = new File([blob], `${file.name}-poster.jpg`, {
            type: "image/jpeg",
          });

          const posterFormData = new FormData();
          posterFormData.append("file", posterFile);
          await fetch("/api/upload", {
            method: "POST",
            body: posterFormData,
          });
        }
        );      });
    }

    // Re-fetch the full folder to include old + new media
    const updatedMedia = await fetchMediaFolder();
    setMediaItems(updatedMedia);
  };

  const closeModal = () => setActiveIndex(null);

  const showPrev = () => {
    setActiveIndex((prev) =>
      prev === null
        ? null
        : (prev - 1 + mediaItems.length) % mediaItems.length
    );
  };

  const showNext = () => {
    setActiveIndex((prev) =>
      prev === null ? null : (prev + 1) % mediaItems.length
    );
  };

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKey = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, mediaItems.length]);

  return (
    <div>
      <NavBar />

      <section className="max-w-6xl mx-auto px-4 mt-10">
        <h1 className="text-4xl italic text-center mb-6">
          A Collection Of Our Finest Work.
        </h1>

        <div className="mb-8 text-center">
          <input
            type="file"
            accept="image/*,video/mp4"
            onChange={handleUpload}
            className="border p-2"
          />
        </div>

        <div
          className="grid gap-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gridAutoRows: "80px",
          }}
        >
          {mediaItems.map((item, i) => (
            <Tile
              key={i}
              src={item.src}
              type={item.type}
              poster={item.poster}
              span={layout[i % layout.length]}
              onClick={() => setActiveIndex(i)}
              priority={i < 2}
            />
          ))}
        </div>
      </section>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="relative w-4/5 h-4/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white text-3xl"
            >
              ✕
            </button>

            <button
              onClick={showPrev}
              className="absolute left-4 top-1/2 text-white text-3xl"
            >
              ‹
            </button>

            <button
              onClick={showNext}
              className="absolute right-4 top-1/2 text-white text-3xl"
            >
              ›
            </button>

            {mediaItems[activeIndex].type === "image" ? (
              <Image
                src={mediaItems[activeIndex].src}
                alt="Preview"
                fill
                style={{ objectFit: "contain" }}
              />
            ) : (
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                <source
                  src={mediaItems[activeIndex].src}
                  type="video/mp4"
                />
              </video>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}