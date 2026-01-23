import Link from "next/link";

import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function Contact() {
  return (
    <main className="bg-white flex flex-col min-h-screen">
      <NavBar />
      
      <div className="flex-grow">
        
        {/* Intro Section */}
        <section className="max-w-5xl mx-auto text-center space-y-6 py-10">
          <div className="border-4 border-[#477A40] rounded-3xl p-8">
            <p className="text-xl md:text-[22px] text-black font-light"><i>
              Thinking about the next big step in achieving your remodeling needs?
              Get in touch today and allow licensed experts to get the job done
              professionally.</i>
            </p>
        

        {/* Contact Title */}
        <section className="text-center max-w-6xl mx-auto text-black space-y-4 p-11">
          <h2 className="text-5xl md:text-6xl font-bold">Contact Us!</h2>
        </section>

        {/* CTA Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto transition-transform">
          <a
            href="tel:5874386672"
            className="text-center flex items-center justify-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white 
             border-2 border-transparent 
             hover:bg-white hover:border-[#477A40] hover:text-[#477A40] 
             transition-all duration-200 
             hover:scale-105 active:scale-95 
             transform-gpu origin-center"
          >
            Call / Text
          </a>

          <a
            href="mailto:landscapecraftsmen@yahoo.com"
            className="text-center flex items-center justify-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white 
             border-2 border-transparent 
             hover:bg-white hover:border-[#477A40] hover:text-[#477A40] 
             transition-all duration-200 
             hover:scale-105 active:scale-95 
             transform-gpu origin-center"
          >
            Email
          </a>

          <Link
            href="/projects"
            className="text-center flex items-center justify-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white 
             border-2 border-transparent 
             hover:bg-white hover:border-[#477A40] hover:text-[#477A40] 
             transition-all duration-200 
             hover:scale-105 active:scale-95 
             transform-gpu origin-center"
          >
            See Our Projects
          </Link>
        </section>

        {/* Contact Details */}
        <section className="max-w-5xl mx-auto space-y-6 text-center text-black p-10">
          <p className="text-3xl">(587) 438-6672</p>

          <div className="bg-white border rounded-3xl p-6">
            <p className="text-lg sm:text-2xl">
              landscapecraftsmen@yahoo.com
            </p>
          </div>

          <p className="text-2xl">
            Calgary, AB, Canada
          </p>
        </section>

        {/* Social Links */}
        <section className="flex justify-center gap-10 text-xl font-semibold text-black pb-4">
          <Link
            href="https://www.instagram.com/landscape.craftsmen"
            target="_blank"
            className="underline"
          >
            Instagram
          </Link>

          <Link
            href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/"
            target="_blank"
            className="underline"
          >
            Facebook
          </Link>
        </section>
          </div>
          </section>
      
      </div>
      
      <Footer />

    </main>
  );
}
