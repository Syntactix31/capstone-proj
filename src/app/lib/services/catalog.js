export const SERVICE_CATALOG = [
  {
    id: "fence",
    name: "Fence Installation",
    shortName: "Fence",
    description: "Custom fence design, materials, and full installation.",
    duration: "1-2 days",
    durationValue: 1,
    durationUnit: "days",
    price: "2800.00",
    quantity: 1,
    active: true,
    estimateKey: "fence",
    aliases: ["Fence Installation", "Fence"],
  },
  {
    id: "deck-railing",
    name: "Deck & Railing",
    shortName: "Deck & Railing",
    description: "Deck builds, railing upgrades, and safety repairs.",
    duration: "3-5 days",
    durationValue: 5,
    durationUnit: "days",
    price: "4500.00",
    quantity: 1,
    active: true,
    estimateKey: "deck",
    aliases: ["Deck & Railing", "Deck Railing", "Deck", "deck", "deck_railing"],
  },
  {
    id: "pergola",
    name: "Pergola",
    shortName: "Pergola",
    description: "Backyard pergola installation and finishing.",
    duration: "1-3 days",
    durationValue: 3,
    durationUnit: "days",
    price: "3200.00",
    quantity: 1,
    active: true,
    estimateKey: "pergola",
    aliases: ["Pergola"],
  },
  {
    id: "sod",
    name: "Sod Installation",
    shortName: "Sod",
    description: "Site prep and fresh sod installation.",
    duration: "1 day",
    durationValue: 1,
    durationUnit: "day",
    price: "1100.00",
    quantity: 1,
    active: false,
    estimateKey: "sod",
    aliases: ["Sod Installation", "Sod"],
  },
  {
    id: "trees-shrubs",
    name: "Trees & Shrubs",
    shortName: "Trees & Shrubs",
    description: "Planting, pruning, and seasonal care.",
    duration: "2-6 hrs",
    durationValue: 1,
    durationUnit: "day",
    price: "1100.00",
    quantity: 1,
    active: true,
    estimateKey: "trees-shrubs",
    aliases: ["Trees & Shrubs", "Trees and Shrubs"],
  },
];

export function getServiceDefinition(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;

  return (
    SERVICE_CATALOG.find((service) => service.id === normalized) ||
    SERVICE_CATALOG.find((service) =>
      service.aliases.some((alias) => String(alias).trim().toLowerCase() === normalized)
    ) ||
    null
  );
}

export function normalizeServiceId(value) {
  return getServiceDefinition(value)?.id || String(value || "").trim();
}

export function normalizeServiceName(value) {
  return getServiceDefinition(value)?.name || String(value || "").trim();
}

export function normalizeServiceList(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((part) => normalizeServiceName(part))
    .filter(Boolean);
}

export function normalizeServiceDisplay(value) {
  const normalized = normalizeServiceList(value);
  if (normalized.length === 0) return String(value || "").trim();
  return [...new Set(normalized)].join(", ");
}
