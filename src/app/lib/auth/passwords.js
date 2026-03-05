import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(password) {
  const normalized = String(password || "");
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(normalized, salt, KEY_LENGTH);
  return `s2$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export function verifyPassword(password, encodedHash) {
  try {
    const normalized = String(password || "");
    const [scheme, saltB64, hashB64] = String(encodedHash || "").split("$");
    if (scheme !== "s2" || !saltB64 || !hashB64) return false;

    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const actual = scryptSync(normalized, salt, expected.length);

    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function isStrongPassword(password) {
  const value = String(password || "");
  if (value.length < 12) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}
