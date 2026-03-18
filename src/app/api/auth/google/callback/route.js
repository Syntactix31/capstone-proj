import { NextResponse } from "next/server";
import { createUser, findUserByEmail, resolveRoleForEmail, updateUser } from "../../../../lib/auth/users";
import { setAuthCookie } from "../../../../lib/auth/server";
import { getGoogleOAuthClientId, getGoogleOAuthClientSecret } from "../../../../lib/auth/googleOAuth";

const OAUTH_STATE_COOKIE = "lc_google_oauth_state";

// Build the callback URL used for this environment/host.
function getRedirectUri(req) {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${new URL(req.url).origin}/api/auth/google/callback`
  );
}

// Exchange the Google auth code for tokens after the user returns from Google.
async function exchangeCodeForTokens({ code, redirectUri }) {
  const clientId = getGoogleOAuthClientId();
  const clientSecret = getGoogleOAuthClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const reason = [data?.error, data?.error_description].filter(Boolean).join("|");
    throw new Error(`TOKEN_EXCHANGE_FAILED:${reason || response.status}`);
  }

  return response.json();
}

// Load the Google account profile tied to the access token.
async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("GOOGLE_USERINFO_FAILED");
  return response.json();
}

// Finish Google sign-in, create/update the user, and set the session cookie.
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const redirectUri = getRedirectUri(req);

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, url.origin));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=missing_google_code", url.origin));
    }

    const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(new URL("/login?error=invalid_google_state", url.origin));
    }

    const tokenData = await exchangeCodeForTokens({ code, redirectUri });
    const googleProfile = await fetchGoogleUserInfo(tokenData.access_token);

    const email = String(googleProfile?.email || "").trim().toLowerCase();
    const name = String(googleProfile?.name || "").trim();
    const picture = String(googleProfile?.picture || "");
    if (!email || !name) {
      return NextResponse.redirect(new URL("/login?error=invalid_google_profile", url.origin));
    }

    let user = await findUserByEmail(email);
    const role = resolveRoleForEmail(email);

    if (!user) {
      user = await createUser({
        email,
        name,
        provider: "google",
        role,
        picture,
      });
    } else {
      user = await updateUser(user.id, {
        name,
        picture,
        provider: user.provider === "local" ? "local" : "google",
        role: resolveRoleForEmail(user.email),
      });
    }

    const destination = user.role === "admin" ? "/dashboard" : "/";
    const res = NextResponse.redirect(new URL(destination, url.origin));
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return setAuthCookie(res, user);
  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    const url = new URL(req.url);
    const reason = String(err?.message || "google_signin_failed")
      .split(":")
      .slice(0, 2)
      .join(":");
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(reason || "google_signin_failed")}`, url.origin),
    );
  }
}

export const runtime = "nodejs";
