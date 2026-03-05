import { NextResponse } from "next/server";

const PRICING = {
  currency: "CAD",
  taxRate: 0,
  fence: { perLfByHeight: { 4: 28, 5: 33, 6: 38 }, gate: 350, postUpgrade: { "4x4": 0, "4x6": 6, "6x6": 10 } },
  deck: {
    perSqft: 55,
    railingPerLf: { none: 0, pt: 35, aluminum: 70 },
    railingCoverage: 0.65,
    heightMultiplier: (h) => (h <= 3 ? 1 : h <= 6 ? 1.12 : h <= 10 ? 1.25 : 1.4),
  },
  pergola: { perSqftByTier: { basic: 45, standard: 60, premium: 80 } },
};

const TYPE_ALIAS = { fence: "fence", deck: "deck", "deck-railing": "deck", "deck_railing": "deck", pergola: "pergola" };
const RAILING_ALIAS = { with: "pt", "with-pt": "pt", "with-ppt": "pt", ptt: "pt", "with-alum": "aluminum", aluminium: "aluminum" };
const money = (n) => Math.round(n * 100) / 100;
const s = (v) => (typeof v === "string" ? v.trim() : "");
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isPos = (v) => isNum(v) && v > 0;
const isInt = (v) => Number.isInteger(v);
const asLower = (v) => (typeof v === "string" ? s(v).toLowerCase() : v);
const typeInput = (v) => (v && typeof v === "object" ? v.key ?? v.type ?? v.slug ?? v.name : v);
const asType = (v) => {
  const t = asLower(typeInput(v));
  return TYPE_ALIAS[t] ?? t;
};
const asRailing = (v) => RAILING_ALIAS[asLower(v)] ?? asLower(v);
const pick = (obj, keys, fallback) => keys.map((k) => obj?.[k]).find((v) => v !== undefined) ?? fallback;
const valueScore = (v) => {
  if (v === undefined || v === null || v === "" || v === false) return 0;
  if (typeof v === "number") return v === 0 ? 0 : 1;
  if (typeof v === "string") {
    const t = s(v).toLowerCase();
    if (!t || t === "none" || t === "4'" || t === "4x4" || t === "standard") return 0;
  }
  return 1;
};
const contentScore = (obj) =>
  !obj || typeof obj !== "object" ? 0 : Object.values(obj).reduce((sum, v) => sum + valueScore(v), 0);
const hasContent = (obj) => contentScore(obj) > 0;

const asNum = (v) => {
  if (isNum(v)) return v;
  if (typeof v !== "string") return v;
  const t = s(v);
  const n = Number(t);
  if (Number.isFinite(n)) return n;
  const stripped = Number(t.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(stripped) ? stripped : v;
};

const asInt = (v) => {
  const n = asNum(v);
  return isNum(n) ? Math.trunc(n) : v;
};

function pickProjectDetails(root, type) {
  if (!root || typeof root !== "object") return {};
  if (type && hasContent(root[type])) return root[type];
  if (type === "deck" && hasContent(root["deck-railing"])) return root["deck-railing"];
  if (hasContent(root.fence) || hasContent(root.deck) || hasContent(root.pergola)) {
    const inferredType = ["fence", "deck", "pergola"]
      .map((k) => ({ key: k, score: contentScore(root[k]) }))
      .sort((a, b) => b.score - a.score)[0];
    return inferredType?.score > 0 ? root[inferredType.key] : root;
  }
  return root;
}

function normalizePayload(raw) {
  const c = raw?.claim ?? raw?.customer ?? raw?.client ?? raw?.contact ?? {};
  const root = raw?.project ?? raw?.job ?? raw?.estimate ?? raw?.service ?? {};
  const requestedType = asType(
    pick(raw, ["projectType", "serviceType", "service", "serviceSlug"], pick(raw?.selectedService, ["key", "type", "slug"]))
  );
  const details = pickProjectDetails(root, requestedType);

  return {
    claim: {
      fullName: s(pick(c, ["fullName", "name", "full_name"], "")),
      homeAddress: s(pick(c, ["homeAddress", "address", "home_address"], "")),
      email: s(pick(c, ["email"], "")).toLowerCase(),
      phone: s(pick(c, ["phone", "phoneNumber", "phone_number"], "")),
    },
    project: {
      ...details,
      projectType: asType(pick(details, ["projectType", "type", "serviceType", "category"], requestedType)),
      totalLinearFeet: asNum(pick(details, ["totalLinearFeet", "linearFeet", "linearFt", "totalFeet", "length", "fenceLength"])),
      numberOfGates: asInt(pick(details, ["numberOfGates", "gates", "gateCount", "numGates"], 0)),
      lengthFeet: asNum(pick(details, ["lengthFeet", "length", "len"])),
      widthFeet: asNum(pick(details, ["widthFeet", "width", "wid"])),
      heightFeet: asNum(pick(details, ["heightFeet", "height", "ht"])),
      postSize: asLower(pick(details, ["postSize", "post_size"])),
      railing: asRailing(details.railing),
      designTier: asLower(pick(details, ["designTier", "tier", "design"], "standard")),
      attachedSide: s(pick(details, ["attachedSide", "attachedToHouse", "houseSide", "houseAttachment"], "unspecified")),
      material: asLower(details.material ?? "pressure-treated wood"),
    },
  };
}

function validate({ claim, project }) {
  const e = [];
  const req = (ok, msg) => !ok && e.push(msg);
  req(!!claim.fullName, "claim.fullName is required.");
  req(!!claim.homeAddress, "claim.homeAddress is required.");
  req(!!claim.email && claim.email.includes("@"), "claim.email must be valid.");
  req(!!claim.phone, "claim.phone is required.");
  const t = project.projectType;
  if (!["fence", "deck", "pergola"].includes(t)) return ["project.projectType must be one of: fence, deck, pergola."];

  if (t === "fence") {
    req(isPos(project.totalLinearFeet), "project.totalLinearFeet must be a positive number.");
    req([4, 5, 6].includes(project.heightFeet), "project.heightFeet must be 4, 5, or 6.");
    req(isInt(project.numberOfGates) && project.numberOfGates >= 0, "project.numberOfGates must be an integer >= 0.");
    req(["4x4", "4x6", "6x6"].includes(project.postSize), "project.postSize must be one of: 4x4, 4x6, 6x6.");
  }
  if (t === "deck") {
    req(isPos(project.lengthFeet), "project.lengthFeet must be a positive number.");
    req(isPos(project.widthFeet), "project.widthFeet must be a positive number.");
    req(isPos(project.heightFeet), "project.heightFeet must be a positive number.");
    req(["none", "pt", "aluminum"].includes(project.railing), "project.railing must be one of: none, pt, aluminum.");
  }
  if (t === "pergola") {
    req(isPos(project.lengthFeet), "project.lengthFeet must be a positive number.");
    req(isPos(project.widthFeet), "project.widthFeet must be a positive number.");
    req(isPos(project.heightFeet), "project.heightFeet must be a positive number.");
    req(["basic", "standard", "premium"].includes(project.designTier), "project.designTier must be one of: basic, standard, premium.");
  }
  return e;
}

function priceFence(p) {
  const rate = PRICING.fence.perLfByHeight[p.heightFeet];
  const items = [{ label: `Fence base (${p.heightFeet}ft)`, qty: p.totalLinearFeet, unit: "linear ft", unitPrice: rate, total: money(rate * p.totalLinearFeet) }];
  const postExtra = PRICING.fence.postUpgrade[p.postSize] || 0;
  if (postExtra > 0) items.push({ label: `Post upgrade (${p.postSize})`, qty: p.totalLinearFeet, unit: "linear ft", unitPrice: postExtra, total: money(postExtra * p.totalLinearFeet) });
  if (p.numberOfGates > 0) items.push({ label: "Gates", qty: p.numberOfGates, unit: "each", unitPrice: PRICING.fence.gate, total: money(PRICING.fence.gate * p.numberOfGates) });
  return {
    subtotal: money(items.reduce((sum, it) => sum + it.total, 0)),
    lineItems: items,
    assumptions: ["Pressure-treated wood assumed.", "Gate cost is a flat estimate; hardware/style may change final quote.", "Removal/grade/soil conditions can affect final quote."],
  };
}

function priceDeck(p) {
  const items = [];
  const area = p.lengthFeet * p.widthFeet;
  const base = PRICING.deck.perSqft * area;
  items.push({ label: "Deck base", qty: money(area), unit: "sq ft", unitPrice: PRICING.deck.perSqft, total: money(base) });
  const mult = PRICING.deck.heightMultiplier(p.heightFeet);
  if (mult > 1) items.push({ label: "Height/complexity adjustment", qty: 1, unit: "x", unitPrice: money(mult), total: money((mult - 1) * base) });
  const railLf = 2 * (p.lengthFeet + p.widthFeet) * PRICING.deck.railingCoverage;
  const railRate = PRICING.deck.railingPerLf[p.railing] || 0;
  if (railRate > 0) items.push({ label: `Railing (${p.railing})`, qty: money(railLf), unit: "linear ft", unitPrice: railRate, total: money(railLf * railRate) });
  const assumptions = ["Pressure-treated wood assumed.", `Railing estimated on ~${Math.round(PRICING.deck.railingCoverage * 100)}% of deck perimeter.`, "Stairs/permits/site prep not included unless specified."];
  if (p.attachedSide === "unspecified") assumptions.push("House attachment side not provided in request.");
  return { subtotal: money(items.reduce((sum, it) => sum + it.total, 0)), lineItems: items, assumptions };
}

function pricePergola(p) {
  const area = p.lengthFeet * p.widthFeet;
  const rate = PRICING.pergola.perSqftByTier[p.designTier];
  const lineItems = [{ label: `Pergola base (${p.designTier})`, qty: money(area), unit: "sq ft", unitPrice: rate, total: money(rate * area) }];
  return { subtotal: money(lineItems[0].total), lineItems, assumptions: ["Pressure-treated wood assumed.", "Design tier affects material/finish complexity."] };
}

export function GET() {
  return NextResponse.json({ ok: true, route: "/api/estimate" });
}

export async function POST(req) {
  let raw;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", details: ["Request body must be valid JSON."] }, { status: 400 });
  }

  try {
    const normalized = normalizePayload(raw);
    const errors = validate(normalized);
    if (errors.length) return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });

    const { claim, project } = normalized;
    const result = project.projectType === "fence" ? priceFence(project) : project.projectType === "deck" ? priceDeck(project) : pricePergola(project);
    const tax = money(result.subtotal * PRICING.taxRate);

    return NextResponse.json({
      estimateId: globalThis.crypto?.randomUUID?.() || `est_${Date.now()}`,
      projectType: project.projectType,
      currency: PRICING.currency,
      claim,
      project,
      subtotal: result.subtotal,
      tax,
      total: money(result.subtotal + tax),
      lineItems: result.lineItems,
      assumptions: result.assumptions,
      disclaimer: "Instant estimate only. Final quote may change after site visit, exact measurements, and material selection.",
    });
  } catch {
    return NextResponse.json({ error: "Server error", message: "Unexpected error while building estimate." }, { status: 500 });
  }
}


