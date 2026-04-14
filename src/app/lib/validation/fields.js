export const FIELD_LIMITS = {
  shortText: 60,
  name: 60,
  email: 120,
  phoneDigits: 10,
  address: 120,
  city: 60,
  province: 60,
  propertyType: 40,
  title: 120,
  serviceName: 120,
  quoteNumber: 40,
  notes: 1000,
  description: 2000,
  additionalInstructions: 1000,
  quantityDigits: 4,
  moneyDigits: 9,
  percentDigits: 5,
};

export function clampLength(value, max) {
  return String(value ?? "").slice(0, max);
}

export function sanitizeLetters(value, max = FIELD_LIMITS.name) {
  return clampLength(String(value ?? "").replace(/[^a-zA-Z\s\-']/g, ""), max);
}

export function sanitizeAlphaSpace(value, max = FIELD_LIMITS.shortText) {
  return clampLength(String(value ?? "").replace(/[^a-zA-Z\s\-&']/g, ""), max);
}

export function sanitizeEmail(value, max = FIELD_LIMITS.email) {
  return clampLength(String(value ?? "").replace(/\s/g, ""), max);
}

export function sanitizeDigits(value, maxDigits) {
  return String(value ?? "").replace(/\D/g, "").slice(0, maxDigits);
}

export function sanitizePhone(value) {
  return sanitizeDigits(value, FIELD_LIMITS.phoneDigits);
}

export function sanitizeMoneyInput(value, { maxDigits = FIELD_LIMITS.moneyDigits } = {}) {
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const whole = (parts[0] || "").slice(0, maxDigits);
  const decimal = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : "";
  return decimal ? `${whole}.${decimal}` : whole;
}

export function sanitizeIntegerInput(value, { maxDigits = FIELD_LIMITS.quantityDigits, min = 1 } = {}) {
  const digits = sanitizeDigits(value, maxDigits);
  if (!digits) return "";
  return String(Math.max(min, Number.parseInt(digits, 10) || min));
}

export function sanitizePercentInput(value) {
  const cleaned = sanitizeMoneyInput(value, { maxDigits: 3 });
  if (!cleaned) return "";
  const numeric = Number.parseFloat(cleaned);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.min(Math.max(numeric, 0), 100));
}

export function sanitizeTextArea(value, max = FIELD_LIMITS.notes) {
  return clampLength(value, max);
}

export function inputPropsFor(field) {
  const map = {
    name: { maxLength: FIELD_LIMITS.name, autoComplete: "name" },
    email: { maxLength: FIELD_LIMITS.email, autoComplete: "email", inputMode: "email" },
    phone: { maxLength: FIELD_LIMITS.phoneDigits, inputMode: "numeric", pattern: "\\d{10}" },
    address: { maxLength: FIELD_LIMITS.address, autoComplete: "street-address" },
    city: { maxLength: FIELD_LIMITS.city, autoComplete: "address-level2" },
    province: { maxLength: FIELD_LIMITS.province, autoComplete: "address-level1" },
    title: { maxLength: FIELD_LIMITS.title },
    serviceName: { maxLength: FIELD_LIMITS.serviceName },
    notes: { maxLength: FIELD_LIMITS.notes },
    description: { maxLength: FIELD_LIMITS.description },
    additionalInstructions: { maxLength: FIELD_LIMITS.additionalInstructions },
    quantity: { inputMode: "numeric", maxLength: FIELD_LIMITS.quantityDigits },
    money: { inputMode: "decimal", maxLength: FIELD_LIMITS.moneyDigits + 3 },
    percent: { inputMode: "decimal", maxLength: FIELD_LIMITS.percentDigits },
    quoteNumber: { maxLength: FIELD_LIMITS.quoteNumber },
  };

  return map[field] || {};
}
