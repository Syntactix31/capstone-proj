import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createSessionToken, sessionCookieOptions, verifySessionToken } from "./session";

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function getRequestUser(req) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function requireAuth(req) {
  const user = getRequestUser(req);
  if (!user) return { error: unauthorized("Authentication required") };
  return { user };
}

export function requireAdmin(req) {
  const result = requireAuth(req);
  if (result.error) return result;
  if (result.user.role !== "admin") return { error: forbidden("Admin access required") };
  return result;
}

export function setAuthCookie(response, user) {
  const token = createSessionToken(user);
  response.cookies.set(AUTH_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}

export function clearAuthCookie(response) {
  response.cookies.set(AUTH_COOKIE_NAME, "", sessionCookieOptions(0));
  return response;
}
