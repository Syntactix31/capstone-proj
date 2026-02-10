"use client";
import { useState, useEffect } from "react";



export default function CommentCarousel() {
  const [comments, setComments] = useState([]);
  const [index, setIndex] = useState(0);

  const [shimmerKey, setShimmerKey] = useState(0);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          const actualReviews = Array.isArray(data) ? data : [];
          setComments(actualReviews);
        } else {
          setComments([
            { name: "Dick B.", text: "Amazing work. Clean, professional, and fast. Highly recommend!", rating: 5 },
            { name: "Edith P.", text: "They transformed our yard completely. Communication was excellent.", rating: 5 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setComments([
          { name: "Nick G.", text: "Best landscaping experience we've ever had.", rating: 5 },
        ]);
      }
    }
    loadReviews();
  }, []);

  // Remove for boxes with loading sign
if (!comments.length && shimmerKey === 0) {
  return <p className="text-center">Loading reviews...</p>;
}

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
      <h2 className="text-3xl font-extrabold text-center border-b-2 p-2 border-[#477a40] inline-block mx-auto mb-7">
        What Our Clients Say
      </h2>

      <div className="relative flex items-center justify-center gap-6 h-63">
        <Bubble data={getItem(-1)} faded />
        <Bubble data={getItem(0)} key={`focused-${shimmerKey}`} focused />
        <Bubble data={getItem(1)} faded />
      </div>

      <div className="flex justify-center gap-6 mt-5">
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
  if (
    !data ||
    typeof data !== "object" ||
    typeof data.text !== "string" ||
    typeof data.name !== "string"
  ) {
    return (
      <div className="rounded-2xl p-6 shadow-lg w-72 border border-dashed border-[#477a40] bg-gray-50">
        <p className="text-sm leading-relaxed text-[#477a40]">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-2xl p-6 shadow-lg transition-all duration-300 w-72
        ${focused ? "scale-110 bg-[#477a40] text-white z-10 more-shimmer" : ""}
        ${faded ? "scale-90 bg-white text-gray-700 opacity-70" : ""}
      `}
    >
      <p className={`text-sm leading-relaxed ${focused ? "more-shimmer" : ""} line-clamp-4`}>
        “{data.text}”
      </p>
      <p className={`mt-2 font-semibold ${focused ? "hidden" : ""}`}>★ {data.rating}</p>
      <p className={`mt-2 font-semibold ${focused ? "" : "hidden"}`}>⭐ {data.rating}</p>
      <p className="mt-4 font-bold text-right">— {data.name}</p>
    </div>
  );
}



// h-35
//  mt-2
// Add slide animation from comments out of focused to middle comment in focus

// ${focused ? "more-shimmer" : ""}





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














