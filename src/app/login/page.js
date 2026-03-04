"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

const OAUTH_ERROR_MESSAGES = {
  access_denied: "Google sign-in was canceled.",
  invalid_google_state: "Google sign-in expired or host mismatch. Start sign-in again from this same URL.",
  missing_google_code: "Google sign-in failed to return an authorization code.",
  invalid_google_profile: "Google returned an incomplete profile. Try a different Google account.",
  GOOGLE_USERINFO_FAILED: "Google account lookup failed after login.",
  GOOGLE_OAUTH_NOT_CONFIGURED: "Google OAuth credentials are missing on the server.",
  google_signin_failed: "Google sign-in failed. Please try again.",
};

export default function LoginPage() {
  const [view, setView] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const message =
        OAUTH_ERROR_MESSAGES[oauthError] ||
        (oauthError.startsWith("TOKEN_EXCHANGE_FAILED")
          ? "Google token exchange failed. Check OAuth client ID/secret and redirect URI."
          : `Google sign-in error: ${oauthError}`);
      setError(message);
    }
  }, [searchParams]);

  async function handleSignIn(event) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Sign in failed.");
        return;
      }

      router.push(data?.user?.role === "admin" ? "/dashboard" : "/");
    } catch {
      setError("Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    const agreedToTerms = Boolean(form.get("terms"));

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          agreedToTerms,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Account creation failed.");
        return;
      }

      router.push(data?.user?.role === "admin" ? "/dashboard" : "/");
    } catch {
      setError("Account creation failed.");
    } finally {
      setBusy(false);
    }
  }

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
            {error ? <p className="admin-error">{error}</p> : null}

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
              <form className="admin-login-form" onSubmit={handleSignIn}>
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
                    placeholder="********"
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

                <button className="admin-btn admin-btn--primary admin-login-btn" type="submit" disabled={busy}>
                  {busy ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}

            {view === "signup" && (
              <form className="admin-login-form" onSubmit={handleSignUp}>
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
                    placeholder="Min 12 chars incl. upper/lower/number/symbol"
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

                <label className="auth-checkbox">
                  <input type="checkbox" name="terms" required />
                  I agree to the terms and privacy policy
                </label>

                <button className="admin-btn admin-btn--primary admin-login-btn" type="submit" disabled={busy}>
                  {busy ? "Creating account..." : "Create account"}
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
                  Password reset is not enabled yet. Contact support for now.
                </p>
                <button className="admin-btn admin-btn--primary admin-login-btn" type="button" disabled>
                  Send reset link
                </button>
                <button className="auth-link" type="button" onClick={() => setView("signin")}>
                  Back to sign in
                </button>
              </form>
            )}

            <div className="auth-divider" />
            <button
              className="admin-btn admin-btn--ghost admin-login-btn"
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/google/start";
              }}
              disabled={busy}
            >
              Continue with Google
            </button>
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
