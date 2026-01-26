"use client";
import { useState } from "react";

const comments = [
  {
    name: "Dick B.",
    text: "Amazing work. Clean, professional, and fast. Highly recommend!",
  },
  {
    name: "Edith P.",
    text: "They transformed our yard completely. Communication was excellent.",
  },
  {
    name: "Mike O.",
    text: "On time, fair pricing, and great attention to detail.",
  },
  {
    name: "Nick G.",
    text: "Best landscaping experience we've ever had.",
  },
  {
    name: "Ben D.",
    text: "Work quality exceeded expectations. Will hire again.",
  },
];

export default function CommentCarousel() {
  const [index, setIndex] = useState(0);

  const [shimmerKey, setShimmerKey] = useState(0);


  const prev = () => {
    setIndex((i) => (i === 0 ? comments.length - 1 : i - 1));
    setShimmerKey((k) => k + 1);
  };

  const next = () => {
    setIndex((i) => (i === comments.length - 1 ? 0 : i + 1));
    setShimmerKey((k) => k + 1);
  };


  const getItem = (offset) =>
    comments[(index + offset + comments.length) % comments.length];

  return (
    <div className="relative flex flex-wrap justify-center w-full max-w-5xl mx-auto mt-16 px-4">
      <h2 className="text-3xl font-extrabold text-center mb-12 border-b-2 p-2 border-[#477a40] inline-block mx-auto">
        What Our Clients Say
      </h2>

      <div className="flex items-center justify-center gap-6">
        <Bubble data={getItem(-1)} faded />
        <Bubble data={getItem(0)} key={`focused-${shimmerKey}`} focused />
        <Bubble data={getItem(1)} faded />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-6 mt-8">
        <button
          onClick={prev}
          className="px-4 py-2 rounded-full border border-[#477a40] text-[#477a40] hover:bg-[#477a40] hover:text-white transition active:scale-95 hover:cursor-pointer"
        >
          ←
        </button>
        <button
          onClick={next}
          className="px-4 py-2 rounded-full border border-[#477a40] text-[#477a40] hover:bg-[#477a40] hover:text-white transition active:scale-95 hover:cursor-pointer"
        >
          →
        </button>
      </div>
    </div>
  );
}

function Bubble({ data, focused, faded }) {
  return (
    <div
      className={`
        rounded-2xl p-6 shadow-lg transition-all duration-300
        ${focused ? "scale-110 bg-[#477a40] text-white z-10 more-shimmer" : ""}
        ${faded ? "scale-90 bg-white text-gray-700 opacity-70" : ""}
        w-72
      `}
    >
      <p className={`text-sm leading-relaxed ${focused ? "more-shimmer" : ""}`}>“{data.text}”</p>
      <p className={`mt-4 font-bold text-right `}>— {data.name}</p>
    </div>
  );
}

// ${focused ? "more-shimmer" : ""}








// Moving elements from review bubble size potential fix


/**
 * export default function CommentCarousel() {
  const [index, setIndex] = useState(0);
  const [shimmerKey, setShimmerKey] = useState(0);

  const prev = () => {
    setIndex((i) => (i === 0 ? comments.length - 1 : i - 1));
    setShimmerKey((k) => k + 1);
  };

  const next = () => {
    setIndex((i) => (i === comments.length - 1 ? 0 : i + 1));
    setShimmerKey((k) => k + 1);
  };

  const getItem = (offset) =>
    comments[(index + offset + comments.length) % comments.length];

  return (
    <section className="relative w-full max-w-5xl mx-auto mt-20 px-4">
      <h2 className="text-3xl font-extrabold text-center mb-12 border-b-2 p-2 border-[#477a40] inline-block mx-auto">
        What Our Clients Say
      </h2>

       👇 HEIGHT-LOCKED STAGE 
      <div className="relative flex items-center justify-center gap-6 h-[260px]">
        <Bubble data={getItem(-1)} faded />
        <Bubble data={getItem(0)} key={`focused-${shimmerKey}`} focused />
        <Bubble data={getItem(1)} faded />
      </div>


      <div className="flex justify-center gap-6 mt-8">
        <button
          onClick={prev}
          className="px-4 py-2 rounded-full border border-[#477a40] text-[#477a40] hover:bg-[#477a40] hover:text-white transition active:scale-95"
        >
          ←
        </button>
        <button
          onClick={next}
          className="px-4 py-2 rounded-full border border-[#477a40] text-[#477a40] hover:bg-[#477a40] hover:text-white transition active:scale-95"
        >
          →
        </button>
      </div>
    </section>
  );
}

 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * function Bubble({ data, focused, faded }) {
  return (
    <div
      className={`
        w-72 rounded-2xl p-6 shadow-lg transition-transform duration-300
        ${focused ? "scale-110 bg-[#477a40] text-white z-10" : ""}
        ${faded ? "scale-90 bg-white text-gray-700 opacity-70" : ""}
      `}
    >
      <p className="text-sm leading-relaxed">“{data.text}”</p>
      <p className="mt-4 font-bold text-right">— {data.name}</p>
    </div>
  );
}

 * 
 * 
 * 
 * 
 * 
 */














