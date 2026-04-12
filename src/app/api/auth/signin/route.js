import { NextResponse } from "next/server";
import { verifyPassword } from "../../../lib/auth/passwords";
import { findUserByEmail, normalizeEmail } from "../../../lib/auth/users";
import { setAuthCookie } from "../../../lib/auth/server";
import { isValidEmail, isValidPasswordLength } from "../../../lib/auth/validation";

// Sign in an existing local account and return a session cookie.
export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isValidEmail(email) || !isValidPasswordLength(password)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Continue with Google." },
        { status: 400 },
      );
    }

    const ok = verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    return setAuthCookie(res, user);
  } catch (error) {
    console.error("SIGNIN ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
