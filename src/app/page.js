import Link from "next/link";
import Image from "next/image";

import NavBar from "./components/Navbar.js";
import Footer from "./components/Footer.js";

export default function Home() {
  return (
    <div className="overflow-hidden">
        <header className="flex w-full bg-white">
          <NavBar />         
        </header>

      <main className="flex min-h-screen w-full bg-white">


        <div className="mx-auto w-full max-w-6xl px-4">
          <section className="relative mt-10 overflow-hidden rounded-3xl border border-[#477a40]/20 bg-gradient-to-br from-[#477a40]/10 via-white to-white p-8 shadow-lg md:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#477a40]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded- bg-[#477a40]/10 blur-3xl" />
 
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#477a40]/10 px-3 py-1 text-sm font-semibold text-[#2f5a29]">
                Licensed • Insured • Free Estimates
              </p>
 
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                The Contracting Company You Can Trust
              </h1>
 
              <h2 className="mt-4 max-w-2xl text-lg leading-relaxed text-black font-bold">
                All your landscaping needs done by professionals—clean work, clear
                communication, and results that last.
              </h2>
 
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
              </p>

            </div>
          </section>
        </div>


      </main>

      <Footer />

    </div>
  );
}




