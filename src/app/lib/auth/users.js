import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function nowIso() {
  return new Date().toISOString();
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function ensureUserStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
}

async function readUsers() {
  await ensureUserStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

async function writeUsers(users) {
  await ensureUserStore();
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

export function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function resolveRoleForEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "client";
  return getAdminEmails().includes(normalized) ? "admin" : "client";
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const users = await readUsers();
  return users.find((user) => normalizeEmail(user.email) === normalized) || null;
}

export async function createUser({
  email,
  name,
  passwordHash = null,
  provider = "local",
  role = "client",
  picture = "",
}) {
  const normalized = normalizeEmail(email);
  const trimmedName = String(name || "").trim();
  const users = await readUsers();

  if (users.some((user) => normalizeEmail(user.email) === normalized)) {
    throw new Error("USER_EXISTS");
  }

  const user = {
    id: randomUUID(),
    email: normalized,
    name: trimmedName,
    role: role === "admin" ? "admin" : "client",
    passwordHash,
    provider,
    picture: String(picture || ""),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

export async function updateUser(userId, patch) {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const current = users[idx];
  users[idx] = {
    ...current,
    ...patch,
    email: patch.email ? normalizeEmail(patch.email) : current.email,
    updatedAt: nowIso(),
  };

  await writeUsers(users);
  return users[idx];
}
