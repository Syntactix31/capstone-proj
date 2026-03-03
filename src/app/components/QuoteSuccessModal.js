"use client";

import { useEffect } from "react";

export default function QuoteSuccessModal({ open, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          bg-white rounded-xl shadow-lg max-w-sm w-11/12 sm:w-96 p-6 text-center
        "
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Quote request sent!
        </h2>
        <p className="text-gray-600 mb-6">
          Your quote request was sent successfully! Please wait 1-2 business days for a quote approval.
        </p>
        <button
          onClick={onClose}
          className="
            w-full bg-green-700 text-white rounded-md py-2
            hover:bg-green-800 transition-colors font-medium
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}




// With animation need to test on phone network first

// "use client";

// import { useEffect, useState } from "react";

// export default function QuoteSuccessModal({ open, onClose }) {
//   const [showIcon, setShowIcon] = useState(false);

//   // Close modal on Escape key press for accessibility
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === "Escape") onClose();
//     };
//     if (open) document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [open, onClose]);

//   // Trigger icon animation with small delay
//   useEffect(() => {
//     if (open) {
//       const timer = setTimeout(() => setShowIcon(true), 150);
//       return () => clearTimeout(timer);
//     } else {
//       setShowIcon(false);
//     }
//   }, [open]);

//   if (!open) return null;

//   return (
//     <div
//       className="
//         fixed inset-0 z-50 flex items-center justify-center
//         bg-black/50 backdrop-blur-sm
//         animate-fadeIn
//       "
//       onClick={onClose}
//     >
//       <div
//         className="
//           bg-white rounded-xl shadow-lg max-w-sm w-11/12 sm:w-96 p-6 text-center
//           transform transition-all duration-300
//           animate-scaleIn
//         "
//         onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
//       >
//         {/* Success icon */}
//         <div
//           className={`
//             flex justify-center items-center mx-auto mb-4 
//             w-14 h-14 rounded-full bg-green-100 
//             transition-all duration-500
//             ${showIcon ? "opacity-100 scale-100" : "opacity-0 scale-50"}
//           `}
//         >
//           <svg
//             className="w-8 h-8 text-green-700"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2.5"
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//           </svg>
//         </div>

//         <h2 className="text-lg font-semibold text-gray-800 mb-3">
//           Quote request sent
//         </h2>
//         <p className="text-gray-600 mb-6">
//           Your quote request was sent successfully. Please check your inbox.
//         </p>
//         <button
//           onClick={onClose}
//           className="
//             w-full bg-green-700 text-white rounded-md py-2
//             hover:bg-green-800 transition-colors font-medium
//           "
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   );
// }

