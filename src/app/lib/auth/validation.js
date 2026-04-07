const EMAIL_MAX_LENGTH = 120;
const NAME_MAX_LENGTH = 60;
const PASSWORD_MAX_LENGTH = 128;

// Keep auth validation server-side so the API does not trust the browser form.
export function isValidEmail(email) {
  const value = String(email || "").trim();
  if (!value || value.length > EMAIL_MAX_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Names can contain letters, spaces, apostrophes, hyphens, and periods.
export function isValidName(name) {
  const value = String(name || "").trim();
  if (!value || value.length > NAME_MAX_LENGTH) return false;
  return /^[A-Za-z][A-Za-z .'-]*$/.test(value);
}

export function isValidPasswordLength(password) {
  const value = String(password || "");
  return value.length > 0 && value.length <= PASSWORD_MAX_LENGTH;
}
