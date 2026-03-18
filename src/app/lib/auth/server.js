import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createSessionToken, sessionCookieOptions, verifySessionToken } from "./session";

// Small helper for consistent 401 responses.
function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

// Small helper for consistent 403 responses.
function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

// Read the signed auth cookie and turn it back into a user object.
export function getRequestUser(req) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Require any logged-in user.
export function requireAuth(req) {
  const user = getRequestUser(req);
  if (!user) return { error: unauthorized("Authentication required") };
  return { user };
}

// Require a logged-in admin user.
export function requireAdmin(req) {
  const result = requireAuth(req);
  if (result.error) return result;
  if (result.user.role !== "admin") return { error: forbidden("Admin access required") };
  return result;
}

// Set the auth cookie after signup/signin/OAuth success.
export function setAuthCookie(response, user) {
  const token = createSessionToken(user);
  response.cookies.set(AUTH_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}

// Clear the auth cookie during logout.
export function clearAuthCookie(response) {
  response.cookies.set(AUTH_COOKIE_NAME, "", sessionCookieOptions(0));
  return response;
}
