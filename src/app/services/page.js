import { Suspense } from "react";
import ClientServices from "./ClientServices";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function ServicesPage() {
  return (
    <div className="overflow-hidden bg-white">
      <header className="flex w-full bg-white">
        <NavBar />
      </header>

      <main className="flex min-h-screen w-full flex-col bg-white">

        <div className="w-full mx-auto max-w-6xl px-4 mt-12">
          <h2 className="mx-auto w-fit text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">
            Choose a Service
          </h2>
        </div>

        <Suspense fallback={
          <div className="w-full mx-auto max-w-6xl px-4 mt-12">
            <div className="mt-8 h-64 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        }>
          <ClientServices />
        </Suspense>

        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}


