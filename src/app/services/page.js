import { Suspense } from "react";
import ClientServices from "./ClientServices";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function ServicesPage() {
  return (
    <div className="services-page-shell">
      <header className="services-page-header">
        <NavBar />
      </header>

      <main className="services-page-main">

        <div className="services-page-title-wrap">
          <h2 className="services-page-title">
            Choose a Service
          </h2>
        </div>

        <Suspense fallback={
          <div className="services-page-fallback-wrap">
            <div className="services-page-fallback-card" />
          </div>
        }>
          <ClientServices />
        </Suspense>

        <div className="services-page-footer-wrap">
          <Footer />
        </div>
      </main>
    </div>
  );
}




