"use client";

import { useState } from "react";
import Link from "next/link";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function LoginPage() {
  const [view, setView] = useState("signin");

  return (
    <div className="auth-wrap">
      <header className="flex w-full bg-white">
        <NavBar />
      </header>

      <main className="admin-login-wrap">
        <div className="auth-shell auth-shell--single">
          <section className="admin-login-card">
            <p className="admin-kicker">Welcome back</p>
            <h1 className="admin-title">Sign in to your account</h1>
            <p className="admin-subtitle">
              Access your bookings, quotes, and saved projects.
            </p>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${view === "signin" ? "auth-tab--active" : ""}`}
                type="button"
                onClick={() => setView("signin")}
              >
                Sign in
              </button>
              <button
                className={`auth-tab ${view === "signup" ? "auth-tab--active" : ""}`}
                type="button"
                onClick={() => setView("signup")}
              >
                Create account
              </button>
            </div>

            {view === "signin" && (
              <form className="admin-login-form">
                <label className="admin-field">
                  <span className="admin-label">Email address</span>
                  <input
                    className="admin-input"
                    type="email"
                    name="email"
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span className="admin-label">Password</span>
                  <input
                    className="admin-input"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </label>

                <div className="auth-row">
                  <label className="auth-checkbox">
                    <input type="checkbox" name="remember" />
                    Remember me
                  </label>
                  <button
                    className="auth-link"
                    type="button"
                    onClick={() => setView("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button className="admin-btn admin-btn--primary admin-login-btn" type="submit">
                  Sign in
                </button>
              </form>
            )}

            {view === "signup" && (
              <form className="admin-login-form">
                <div className="auth-grid">
                  <label className="admin-field">
                    <span className="admin-label">First name</span>
                    <input
                      className="admin-input"
                      type="text"
                      name="firstName"
                      placeholder="John"
                      autoComplete="given-name"
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Last name</span>
                    <input
                      className="admin-input"
                      type="text"
                      name="lastName"
                      placeholder="Appleseed"
                      autoComplete="family-name"
                      required
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span className="admin-label">Email address</span>
                  <input
                    className="admin-input"
                    type="email"
                    name="email"
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span className="admin-label">Password</span>
                  <input
                    className="admin-input"
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span className="admin-label">Confirm password</span>
                  <input
                    className="admin-input"
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                  />
                </label>

                <button className="admin-btn admin-btn--primary admin-login-btn" type="submit">
                  Create account
                </button>
              </form>
            )}

            {view === "forgot" && (
              <form className="admin-login-form">
                <label className="admin-field">
                  <span className="admin-label">Email address</span>
                  <input
                    className="admin-input"
                    type="email"
                    name="email"
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <p className="admin-muted">
                  We will send a password reset link to this email.
                </p>
                <button className="admin-btn admin-btn--primary admin-login-btn" type="submit">
                  Send reset link
                </button>
                <button className="auth-link" type="button" onClick={() => setView("signin")}>
                  Back to sign in
                </button>
              </form>
            )}

            <div className="auth-divider" />
            <p className="auth-footer">
              By continuing you agree to our{" "}
              <Link className="auth-link" href="/terms">
                terms and privacy policy
              </Link>
              .
            </p>
            <p className="auth-footer">
              Need help?{" "}
              <Link className="auth-link" href="/contact">
                Contact support
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
