import Link from "next/link";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function About() {
  return (
    <main className="bg-white flex flex-col min-h-screen">
      <NavBar />

      <div className="grow">
        
        {/* Top Team Image Placeholder */}
        <section className="w-full h-64 md:h-100 bg-[#D3D3D3] border-b-8 border-[#477A40] flex items-center justify-center">
           <p className="text-gray-500 font-bold text-xl">Main Team Image</p>
        </section>

        {/* Mission Section */}
        <section className="max-w-6xl mx-auto py-16 px-4">
          <div className="relative overflow-hidden rounded-xl border border-[#477a40]/20 bg-linear-to-br from-[#477a40]/10 via-white to-white p-8 shadow-lg md:p-12 mx-auto">
            
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#477a40]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[#477a40]/10 blur-3xl" />

            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#477a40]/10 px-3 py-1 text-sm font-semibold text-[#2f5a29]">
                Licensed • Insured • Free Estimates
              </p>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl max-w-2xl leading-tight">
                The Contracting Company You Can Trust
              </h1>

              <h2 className="mt-4 max-w-2xl text-lg leading-relaxed text-black font-bold">
                All your landscaping needs done by professionals—clean work, clear
                communication, and results that last.
              </h2>

              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.<br/><br/>

                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.<br/><br/>

                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section*/}
        <section className="py-10 px-6 max-w-6xl mx-auto">
          {/* Maybe change this to black text with green underline for consistency */}
          <h2 className="text-5xl md:text-6xl font-extrabold text-center mb-16 border-b-2 p-2 text- border-[#477A40] w-150 mx-auto">
            Meet the Team
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map((member) => (
              <div key={member} className="flex flex-col items-center group">
                
                {/* Photo Frame */}
                <div className="w-full aspect-3/4 bg-white border-4 border-[#477A40] rounded-3xl shadow-xl overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                   <span className="text-gray-400 font-bold italic">Team Member Photo</span>
                </div>
                
                {/* Bio Box */}
                <div className="mt-10 p-6 rounded-2xl border-2 border-[#477A40] bg-white shadow-sm text-center">
                  <p className="text-black text-base leading-snug font-medium">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
                  </p>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* Final Tagline */}
        <section className="max-w-6xl mx-auto text-center py-24 px-6">
          <p className="text-3xl md:text-5xl italic font-light text-gray-700 leading-tight">
            Committed to <span className="text-[#477A40] font-bold not-italic">quality</span> and  <span className="text-[#477A40] font-bold not-italic">excellence</span> in every project.
          </p>
        </section>

      </div>

      <Footer />
    </main>
  );
}