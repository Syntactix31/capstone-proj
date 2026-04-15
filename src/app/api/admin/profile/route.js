import { NextResponse } from "next/server";
import { requireAdmin, setAuthCookie } from "../../../lib/auth/server";
import { ensureDatabaseSchema } from "../../../lib/db/schema.js";
import { getSql } from "../../../lib/db/client";
import { listAdminActivity, createAdminActivity } from "../../../lib/db/adminActivity.js";
import { normalizeEmail, updateUser } from "../../../lib/auth/users";

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    provider: row.provider,
    picture: row.picture || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadAdminProfile(email) {
  await ensureDatabaseSchema();
  const sql = await getSql();
  const rows = await sql`
    SELECT *
    FROM users
    WHERE email = ${normalizeEmail(email)}
    LIMIT 1
  `;

  return mapUserRow(rows[0]);
}

async function loadAdminSummary() {
  await ensureDatabaseSchema();
  const sql = await getSql();
  const [statsRow] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE role = 'admin')::int AS admin_count,
      COUNT(*) FILTER (WHERE role = 'admin' AND provider = 'google')::int AS google_admin_count,
      COUNT(*) FILTER (WHERE role = 'admin' AND provider = 'local')::int AS local_admin_count
    FROM users
  `;

  const adminRows = await sql`
    SELECT id, name, email, role, provider, created_at, updated_at
    FROM users
    WHERE role = 'admin'
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 6
  `;

  return {
    adminCount: statsRow?.admin_count || 0,
    googleAdminCount: statsRow?.google_admin_count || 0,
    localAdminCount: statsRow?.local_admin_count || 0,
    admins: adminRows.map(mapUserRow),
  };
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const [user, summary, history] = await Promise.all([
      loadAdminProfile(auth.user.email),
      loadAdminSummary(),
      listAdminActivity({ limit: 12 }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Admin profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      user,
      summary,
      history,
    });
  } catch (error) {
    console.error("ADMIN PROFILE GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load admin settings." }, { status: 500 });
  }
}

export async function PATCH(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const currentUser = await loadAdminProfile(auth.user.email);

    if (!currentUser) {
      return NextResponse.json({ error: "Admin profile not found." }, { status: 404 });
    }

    const nextName = String(body?.name || "").trim();
    const nextEmail = normalizeEmail(body?.email);

    if (!nextName || !nextEmail) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const updatedUser = await updateUser(currentUser.id, {
      name: nextName,
      email: nextEmail,
      role: currentUser.role,
      provider: currentUser.provider,
      picture: currentUser.picture,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update admin profile." }, { status: 500 });
    }

    await createAdminActivity({
      adminUserId: updatedUser.id,
      adminName: updatedUser.name,
      adminEmail: updatedUser.email,
      action: "Updated settings",
      details:
        currentUser.email !== updatedUser.email
          ? `Changed profile name to ${updatedUser.name} and updated email to ${updatedUser.email}.`
          : `Changed profile name to ${updatedUser.name}.`,
      metadata: {
        previousName: currentUser.name,
        previousEmail: currentUser.email,
        nextName: updatedUser.name,
        nextEmail: updatedUser.email,
      },
    });

    const response = NextResponse.json({ user: updatedUser, success: true });
    return setAuthCookie(response, updatedUser);
  } catch (error) {
    console.error("ADMIN PROFILE PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to save admin settings." }, { status: 500 });
  }
}

export const runtime = "nodejs";
