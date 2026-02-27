import Link from "next/link";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function Contact() {
  return (
    <div className="overflow-hidden bg-white">
      <header className="flex w-full bg-white">
        <NavBar />
      </header>

      <main className="flex flex-col min-h-screen w-full bg-white gap-15">
        <div className="w-full mx-auto max-w-8xl px-4">
          <section className="max-w-4xl relative mt-10 overflow-hidden rounded-xl border border-[#477a40]/20 bg-gradient-to-br from-[#477a40]/10 via-white to-white p-8 md:p-12 mx-auto flex flex-col gap-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#477a40]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[#477a40]/10 blur-3xl" />

            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#477a40]/10 px-4 py-2 text-sm font-semibold text-[#2f5a29]">
                🛠️ Get In Touch Today
              </p>
              
              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                Ready For Your Project?
              </h1>
              
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-black font-normal">
                <i>Thinking about your next big landscaping project?
                Get in touch today and allow licensed experts to get the job done professionally.</i>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <a
                href="tel:5874386672"
                className="group relative p-6 mx-auto text-white rounded-2xl bg-[#477a40] text-xl sm:text-2xl font-bold w-full max-w-md text-center hover:cursor-pointer border-2 border-transparent hover:bg-white hover:border-[#477A40] hover:text-[#477A40] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl md:shadow-2xl"
              >
                <span>Call / Text</span>
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-4 text-xl font-bold group-hover:translate-x-1 transition-all duration-300">
                  →
                </span>
              </a>

              <a
                href="mailto:landscapecraftsmen@yahoo.com"
                className="group relative p-6 mx-auto text-white rounded-2xl bg-[#477a40] text-xl sm:text-2xl font-bold w-full max-w-md text-center hover:cursor-pointer border-2 border-transparent hover:bg-white hover:border-[#477A40] hover:text-[#477A40] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl md:shadow-2xl"
              >
                <span>Email Us</span>
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-4 text-xl font-bold group-hover:translate-x-1 transition-all duration-300">
                  →
                </span>
              </a>

              <Link
                href="/projects"
                className="group relative p-6 mx-auto text-white rounded-2xl bg-[#477a40] text-xl sm:text-2xl font-bold w-full max-w-md text-center hover:cursor-pointer border-2 border-transparent hover:bg-white hover:border-[#477A40] hover:text-[#477A40] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl md:shadow-2xl"
              >
                <span>See Our Work</span>
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-4 text-xl font-bold group-hover:translate-x-1 transition-all duration-300">
                  →
                </span>
              </Link>
            </div>
          </section>
        </div>

        {/* Contact Details Section - Matches "What We Offer" style */}
        <div className="w-full mx-auto max-w-4xl px-4 pb-10">
          <h2 className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto text-center p-4 text-3xl font-extrabold border-b-4 border-[#477a40] text-black mb-16">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            {/* Phone */}
            <div className="group relative p-8 rounded-2xl border-2 border-[#477a40]/20 hover:border-[#477a40]/50 bg-[#477a40]/5 hover:bg-[#477a40]/10 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">(587) 438-6672</h3>
              <a href="tel:5874386672" className="text-lg font-semibold text-[#477a40] hover:underline">
                Call or Text Now
              </a>
            </div>

            {/* Email */}
            <div className="group relative p-8 rounded-2xl border-2 border-[#477a40]/20 hover:border-[#477a40]/50 bg-[#477a40]/5 hover:bg-[#477a40]/10 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-4xl mb-4">✉️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 break-all">
                landscapecraftsmen@yahoo.com
              </h3>
              <a href="mailto:landscapecraftsmen@yahoo.com" className="text-lg font-semibold text-[#477a40] hover:underline">
                Send Email
              </a>
            </div>
          </div>

          {/* Location & Social */}
          <div className="text-center mt-16 space-y-6">
            <div className="p-8 rounded-2xl border-2 border-[#477a40]/20 bg-gradient-to-r from-[#477a40]/5 to-white">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Calgary, AB, Canada</h3>
              <p className="text-lg text-gray-600">Serving the Calgary area</p>
            </div>

            {/* Social Links */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-8">
              <Link 
                href="https://www.instagram.com/landscape.craftsmen" 
                target="_blank" 
                className="group inline-flex items-center gap-2 text-xl font-bold text-[#477a40] hover:text-black transition-all duration-200 hover:underline hover:underline-offset-4"
              >
                Instagram 
              </Link>
              <Link 
                href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/" 
                target="_blank" 
                className="group inline-flex items-center gap-2 text-xl font-bold text-[#477a40] hover:text-black transition-all duration-200 hover:underline hover:underline-offset-4"
              >
                Facebook 
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


/**   ======== TODO =========
 * Add hover animation on the the call and text boxes at the bottom so 
 * when a desktop user hovers on it the phone/email emoji animates
 * 
 * 
 * 
 */







































// import Link from "next/link";

// import NavBar from "../components/Navbar.js";
// import Footer from "../components/Footer.js";

// export default function Contact() {
//   return (
//     <main className="bg-white flex flex-col min-h-screen">
//       <NavBar />
      
//       <div className="flex-grow">
        
//         {/* Intro Section */}
//         <section className="max-w-5xl mx-auto text-center space-y-6 py-10">
//           <div className="border-4 border-[#477A40] rounded-3xl p-8">
//             <p className="text-xl md:text-[22px] text-black font-light"><i>
//               Thinking about the next big step in achieving your remodeling needs?
//               Get in touch today and allow licensed experts to get the job done
//               professionally.</i>
//             </p>
        

//         {/* Contact Title */}
//         <section className="text-center max-w-6xl mx-auto text-black space-y-4 p-11">
//           <h2 className="text-5xl md:text-6xl font-bold">Contact Us!</h2>
//         </section>

//         {/* CTA Section */}
//         <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto transition-transform">
//           <a
//             href="tel:5874386672"
//             className="text-center flex items-center justify-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white 
//              border-2 border-transparent 
//              hover:bg-white hover:border-[#477A40] hover:text-[#477A40] 
//              transition-all duration-200 
//              hover:scale-105 active:scale-95 
//              transform-gpu origin-center"
//           >
//             Call / Text
//           </a>

//           <a
//             href="mailto:landscapecraftsmen@yahoo.com"
//             className="text-center flex items-center justify-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white 
//              border-2 border-transparent 
//              hover:bg-white hover:border-[#477A40] hover:text-[#477A40] 
//              transition-all duration-200 
//              hover:scale-105 active:scale-95 
//              transform-gpu origin-center"
//           >
//             Email
//           </a>

//           <Link
//             href="/projects"
//             className="text-center flex items-center justify-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white 
//              border-2 border-transparent 
//              hover:bg-white hover:border-[#477A40] hover:text-[#477A40] 
//              transition-all duration-200 
//              hover:scale-105 active:scale-95 
//              transform-gpu origin-center"
//           >
//             See Our Projects
//           </Link>
//         </section>

//         {/* Contact Details */}
//         <section className="max-w-5xl mx-auto space-y-6 text-center text-black p-10">
//           <p className="text-3xl">(587) 438-6672</p>

//           <div className="bg-white border rounded-3xl p-6">
//             <p className="text-sm sm:text-2xl">
//               landscapecraftsmen@yahoo.com
//             </p>
//           </div>

//           <p className="text-2xl">
//             Calgary, AB, Canada
//           </p>
//         </section>

//         {/* Social Links */}
//         <section className="flex justify-center gap-10 text-xl font-semibold text-black pb-4">
//           <Link
//             href="https://www.instagram.com/landscape.craftsmen"
//             target="_blank"
//             className="underline"
//           >
//             Instagram
//           </Link>

//           <Link
//             href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/"
//             target="_blank"
//             className="underline"
//           >
//             Facebook
//           </Link>
//         </section>
//           </div>
//           </section>
      
//       </div>
      
//       <Footer />

//     </main>
//   );
// }



