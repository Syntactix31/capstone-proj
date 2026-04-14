import {
  DetectModerationLabelsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const DEFAULT_MIN_CONFIDENCE = 80;
const DEFAULT_BLOCK_LABELS = [
  "explicit nudity",
  "graphic male nudity",
  "graphic female nudity",
  "sexual activity",
  "graphic violence or physical injury",
  "physical violence",
  "weapon violence",
  "drugs",
  "hate symbols",
  "self harm",
];

let rekognitionClient;

function createModerationError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function parseBlockLabels(value) {
  if (!value) {
    return new Set(DEFAULT_BLOCK_LABELS);
  }

  return new Set(
    value
      .split(",")
      .map((label) => normalizeLabel(label))
      .filter(Boolean),
  );
}

function getMinConfidence() {
  const value = Number(readEnv("AWS_REKOGNITION_MIN_CONFIDENCE"));

  if (!Number.isFinite(value)) {
    return DEFAULT_MIN_CONFIDENCE;
  }

  return Math.max(0, Math.min(100, value));
}

function getCredentials() {
  const accessKeyId = readEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("AWS_SECRET_ACCESS_KEY");
  const sessionToken = readEnv("AWS_SESSION_TOKEN");
  const region = readEnv("AWS_REGION") || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    throw createModerationError(
      "Content moderation is unavailable because AWS Rekognition credentials are not configured.",
      "MODERATION_NOT_CONFIGURED",
      503,
    );
  }

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    },
  };
}

function getClient() {
  if (!rekognitionClient) {
    rekognitionClient = new RekognitionClient(getCredentials());
  }

  return rekognitionClient;
}

export function isImageMimeType(mimeType = "") {
  return String(mimeType).toLowerCase().startsWith("image/");
}

export function isModeratedImageType(mimeType = "") {
  return SUPPORTED_IMAGE_TYPES.has(String(mimeType).toLowerCase());
}

export async function moderateImageBytes({ bytes, mimeType, source = "upload" }) {
  if (!isImageMimeType(mimeType)) {
    return {
      allowed: true,
      blocked: false,
      blockedLabels: [],
      moderationLabels: [],
      source,
    };
  }

  if (!isModeratedImageType(mimeType)) {
    throw createModerationError(
      "Only JPEG and PNG images are supported for AI content moderation right now. Please convert the image or upload a PDF.",
      "UNSUPPORTED_IMAGE_TYPE",
      400,
    );
  }

  const minConfidence = getMinConfidence();
  const blockedLabelSet = parseBlockLabels(readEnv("AWS_REKOGNITION_BLOCK_LABELS"));

  const response = await getClient().send(
    new DetectModerationLabelsCommand({
      Image: { Bytes: bytes },
      MinConfidence: minConfidence,
    }),
  );

  const moderationLabels = (response.ModerationLabels || []).map((label) => ({
    name: label.Name || "",
    parentName: label.ParentName || "",
    confidence: Number(label.Confidence || 0),
  }));

  const blockedLabels = moderationLabels.filter((label) => {
    const name = normalizeLabel(label.name);
    const parentName = normalizeLabel(label.parentName);
    return blockedLabelSet.has(name) || (parentName && blockedLabelSet.has(parentName));
  });

  if (blockedLabels.length > 0) {
    console.warn("[Rekognition] Blocked image content", {
      source,
      blockedLabels,
      minConfidence,
    });
  }

  return {
    allowed: blockedLabels.length === 0,
    blocked: blockedLabels.length > 0,
    blockedLabels,
    moderationLabels,
    minConfidence,
    source,
  };
}
