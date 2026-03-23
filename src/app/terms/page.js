"use client";

import Link from "next/link";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function TermsPage() {
  return (
    <div className="auth-wrap">
      <header className="flex w-full bg-white">
        <NavBar />
      </header>

      <main className="admin-login-wrap">
        <div className="auth-shell auth-shell--single">
          <section className="admin-login-card">
            <div className="auth-header-row">
              <Link className="auth-link auth-back" href="/login">
                &larr; Back
              </Link>
            </div>

            <h1 className="admin-title">Terms & Privacy Policy</h1>
            <p className="admin-subtitle">
              Please review the terms of service and privacy policy below.
            </p>

            <div className="auth-divider" />

            <div className="admin-form">
              <div>
                <h2 className="admin-card-title">Terms of Service</h2>
                <p className="admin-muted">
                  By using this site, you agree to use it responsibly and comply
                  with all applicable laws. Services and pricing are subject to
                  change without notice. Scheduling requests are not guaranteed
                  until confirmed.
                </p>
              </div>

              <div>
                <h2 className="admin-card-title">Privacy Policy</h2>
                <p className="admin-muted">
                  We collect only the information needed to provide services and
                  communicate with you. We do not sell your personal data. You may
                  request access, updates, or deletion of your data by contacting
                  support.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
