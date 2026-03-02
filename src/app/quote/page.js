import { Suspense } from "react";
import QuoteClient from "./QuoteClient";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function QuotePage() {
  return (
    <div className="overflow-hidden bg-white min-h-screen flex flex-col">
      <header className="shrink-0">
        <NavBar />
      </header>
      <Suspense fallback={<div>Loading quote form...</div>}>
        <QuoteClient />
      </Suspense>
      <footer className="shrink-0 mt-auto">
        <Footer />
      </footer>
    </div>
  );
}

// Resolve server side static rendering issue



