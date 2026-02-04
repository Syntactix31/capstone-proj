"use client";
import { useState } from "react";
import Image from "next/image";

import NavBar from "../components/Navbar";
import Footer from "../components/Footer.js";

const images = [
  "/projects/0ca9cee4-984b-4379-9e97-339140fcc257.JPG",
  "/projects/2e084da0-0d96-44f0-a943-3f9080bd1191.JPG",
  "/projects/9a8bb317-ee87-4071-bcd1-9d7ac9690ccc.JPG",
  "/projects/9e2d7e4d-d537-4324-8291-a7169bd60fe9.JPG",
  "/projects/43a2614c-3692-429f-bf0a-bcd1c4ee4ce6.JPG",
  "/projects/53a7773d-92c1-47ee-a7cd-573065ba01eb.JPG",
  "/projects/58ea80d9-b8e9-4949-b6ac-d91b39814301.JPG",
  "/projects/84c75c6b-235f-4ed9-811f-9e8b2c601b90.JPG",
  "/projects/129d5c82-ea89-4650-b3a6-a40563e53dda.JPG",
  "/projects/287a6cb6-1d45-4f5b-8a47-d50d2f87a58b.JPG",
  "/projects/590baa48-c0b6-43b4-8f03-1abf3a710295.JPG",
  "/projects/881a60f4-b7f6-4fea-a8ad-667abcead1e0.JPG",
  "/projects/6124ded5-f2e1-49de-b1dd-8c593cd53aaf.JPG"
];

// 13 “Figma slots” using 12-col grid.
// Each item = { c: columnSpan, r: rowSpan }
const layout = [
  { c: 3, r: 7 },  // tall left
  { c: 6, r: 4 },  // big top center
  { c: 3, r: 7 },  // tall right
  { c: 6, r: 3 },  // mid center
  { c: 6, r: 3 },  // bottom center

  { c: 3, r: 3 },  // extra tiles (fill out like Figma’s extra slots)
  { c: 3, r: 3 },
  { c: 3, r: 3 },
  { c: 3, r: 3 },

  { c: 4, r: 3 },
  { c: 4, r: 3 },
  { c: 4, r: 3 },

  { c: 12, r: 4 }  // optional wide “final hero tile” at bottom
];

function Tile({ src, span, onClick }) {
  return (
    <div
      className="tile relative overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-105"
      style={{
        gridColumn: `span ${span.c}`,
        gridRow: `span ${span.r}`
      }}
      onClick={onClick}
    >
      <Image
        src={src}
        alt="Project image"
        fill
        style={{ objectFit: "cover" }}
        sizes="(max-width: 900px) 100vw, 33vw"
      />
    </div>
  );
}

export default function ProjectsPage() {

  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const openModal = (src) => {
    setSelectedImage(src);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedImage(null), 300);
  }; 




  return (
    <>
    <NavBar />
    
    <div className="bg-white dark:bg-white text-black dark:text-black">
        <div className="w-full mx-auto max-w-7xl px-4">
          <section className="relative mt-10 overflow-hidden rounded-xl border border-[#477a40]/20 bg-linear-to-br from-[#2f5a29]/15 via-white to-white p-8 shadow-lg md:p-12 mx-auto">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2f5a29]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[#477a40]/10 blur-3xl" />

            <div className="relative">
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-center text-gray-900 sm:text-5xl">
                A Collection Of Our <br /> Finest Work.
              </h1>
            </div>
          </section>
        </div>

      <section className="projectsSection">

        <div className="collage">
          {images.slice(0, 13).map((src, i) => (
            <Tile key={i} src={src} span={layout[i] || { c: 4, r: 3 }} onClick={() => openModal(src)}/>
          ))}
        </div>
      </section>

      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity animate-fadeIn" onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}>
          <div className="relative animate-zoomIn">
            <span
              className="absolute top-2 right-5 text-white text-4xl font-bold cursor-pointer hover:scale-110 transition-transform"
              onClick={closeModal}
            >
              &times;
            </span>
            <Image
              src={selectedImage}
              alt="Preview"
              width={0}
              height={0}
              sizes="100vw"
              className="h-auto w-auto max-w-[95vw] max-h-[95vh] rounded-md object-contain"
            />
          </div>
        </div>
      )}      




    </div>

    <Footer />
    
    </>
  );
}
