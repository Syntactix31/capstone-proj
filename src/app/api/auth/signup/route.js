import { NextResponse } from "next/server";
import { hashPassword, isStrongPassword } from "../../../lib/auth/passwords";
import { createUser, findUserByEmail, normalizeEmail, resolveRoleForEmail } from "../../../lib/auth/users";
import { setAuthCookie } from "../../../lib/auth/server";
import { isValidEmail, isValidName, isValidPasswordLength } from "../../../lib/auth/validation";

// Reuse one helper for simple 400 validation responses.
function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Create a local account, then sign the user in right away.
export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");
    const firstName = String(body?.firstName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const agreedToTerms = Boolean(body?.agreedToTerms);
    const name = `${firstName} ${lastName}`.trim();

    if (!email || !password || !firstName || !lastName) {
      return badRequest("Missing required fields.");
    }

    if (!isValidEmail(email)) {
      return badRequest("Enter a valid email address.");
    }

    if (!isValidName(firstName) || !isValidName(lastName)) {
      return badRequest("Names can only use letters, spaces, apostrophes, hyphens, and periods.");
    }

    if (!isValidPasswordLength(password)) {
      return badRequest("Password must be 128 characters or fewer.");
    }

    if (!agreedToTerms) {
      return badRequest("You must agree to terms to create an account.");
    }

    if (!isStrongPassword(password)) {
      return badRequest(
        "Use at least 12 characters with uppercase, lowercase, number, and symbol.",
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await createUser({
      email,
      name,
      passwordHash: hashPassword(password),
      provider: "local",
      role: resolveRoleForEmail(email),
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    return setAuthCookie(res, user);
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
