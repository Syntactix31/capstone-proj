import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "lc_auth_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Encode data into a URL-safe string for the cookie token.
function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

// Decode the URL-safe token payload back into text.
function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

// Read the secret used to sign session tokens.
function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET");
  }
  return secret;
}

// Create the token signature so tampered cookies can be rejected.
function sign(data) {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

// Build the signed session token stored in the auth cookie.
export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

// Verify the token signature and expiry before trusting the cookie.
export function verifySessionToken(token) {
  try {
    const [encoded, sig] = String(token || "").split(".");
    if (!encoded || !sig) return null;

    const expected = sign(encoded);
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const payload = JSON.parse(base64UrlDecode(encoded));
    if (!payload?.sub || !payload?.email || !payload?.role) return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Shared cookie settings for login/logout flows.
export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
