export const DEFAULT_GST_RATE = 0.05;
export const DEFAULT_DEPOSIT_RATE = 0.5;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeMoneyValue(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(parsed, 0);
}

export function normalizeQuantityValue(value, fallback = 1) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(parsed, 1);
}

export function normalizeRateValue(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) return fallback;

  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return clamp(normalized, 0, 1);
}

export function calculateQuoteTotals({
  unitPrice,
  quantity,
  gstRate = DEFAULT_GST_RATE,
  depositRate = DEFAULT_DEPOSIT_RATE,
}) {
  const normalizedUnitPrice = normalizeMoneyValue(unitPrice, 0);
  const normalizedQuantity = normalizeQuantityValue(quantity, 1);
  const normalizedGstRate = normalizeRateValue(gstRate, DEFAULT_GST_RATE);
  const normalizedDepositRate = normalizeRateValue(
    depositRate,
    DEFAULT_DEPOSIT_RATE
  );

  const subtotal = normalizedUnitPrice * normalizedQuantity;
  const gstAmount = subtotal * normalizedGstRate;
  const total = subtotal + gstAmount;
  const depositAmount = total * normalizedDepositRate;

  return {
    unitPrice: normalizedUnitPrice.toFixed(2),
    quantity: String(normalizedQuantity),
    gstRate: normalizedGstRate.toFixed(4),
    depositRate: normalizedDepositRate.toFixed(4),
    subtotal: subtotal.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    total: total.toFixed(2),
    depositAmount: depositAmount.toFixed(2),
  };
}

export function buildQuoteData(input = {}, fallback = {}) {
  const merged = { ...fallback, ...input };
  const totals = calculateQuoteTotals({
    unitPrice: merged.unitPrice,
    quantity: merged.quantity,
    gstRate: merged.gstRate,
    depositRate: merged.depositRate,
  });

  return {
    quoteNumber: String(merged.quoteNumber || "").trim(),
    priceMode: merged.priceMode === "custom" ? "custom" : "default",
    unitPrice: totals.unitPrice,
    quantity: totals.quantity,
    description: String(merged.description || "").trim(),
    sentDate: String(merged.sentDate || todayDateValue()).trim() || todayDateValue(),
    gstRate: totals.gstRate,
    depositRate: totals.depositRate,
    subtotal: totals.subtotal,
    gstAmount: totals.gstAmount,
    total: totals.total,
    depositAmount: totals.depositAmount,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(normalizeMoneyValue(value, 0));
}

export function formatPercent(value) {
  return `${(normalizeRateValue(value, 0) * 100).toFixed(1)}%`;
}

export function formatRateInputValue(value) {
  const numeric = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(numeric)) return "";
  return String(numeric > 1 ? numeric : numeric * 100);
}

export function formatLongDate(value) {
  const date = new Date(`${String(value || "").slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value || "");

  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
