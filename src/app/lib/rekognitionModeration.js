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
const MIME_TYPE_ALIASES = new Map([
  ["image/jpg", "image/jpeg"],
  ["image/pjpeg", "image/jpeg"],
  ["image/jfif", "image/jpeg"],
  ["image/x-png", "image/png"],
]);
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

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

export function normalizeImageMimeType(mimeType = "") {
  const normalized = normalizeLabel(mimeType);
  return MIME_TYPE_ALIASES.get(normalized) || normalized;
}

function bytesMatchSignature(bytes, signature) {
  return (
    Buffer.isBuffer(bytes) &&
    bytes.length >= signature.length &&
    signature.every((value, index) => bytes[index] === value)
  );
}

function looksLikeJpeg(bytes) {
  return Buffer.isBuffer(bytes) && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function validateSupportedImageBytes(bytes, mimeType) {
  const normalizedMimeType = normalizeImageMimeType(mimeType);

  if (normalizedMimeType === "image/jpeg" && !looksLikeJpeg(bytes)) {
    throw createModerationError(
      "Only standard JPEG and PNG images are supported for AI content moderation right now. Please convert the image and try again.",
      "UNSUPPORTED_IMAGE_TYPE",
      400,
    );
  }

  if (normalizedMimeType === "image/png" && !bytesMatchSignature(bytes, PNG_SIGNATURE)) {
    throw createModerationError(
      "Only standard JPEG and PNG images are supported for AI content moderation right now. Please convert the image and try again.",
      "UNSUPPORTED_IMAGE_TYPE",
      400,
    );
  }

  return normalizedMimeType;
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
  return normalizeImageMimeType(mimeType).startsWith("image/");
}

export function isModeratedImageType(mimeType = "") {
  return SUPPORTED_IMAGE_TYPES.has(normalizeImageMimeType(mimeType));
}

export async function moderateImageBytes({ bytes, mimeType, source = "upload" }) {
  const normalizedMimeType = normalizeImageMimeType(mimeType);

  if (!isImageMimeType(normalizedMimeType)) {
    return {
      allowed: true,
      blocked: false,
      blockedLabels: [],
      moderationLabels: [],
      source,
    };
  }

  if (!isModeratedImageType(normalizedMimeType)) {
    throw createModerationError(
      "Only JPEG and PNG images are supported for AI content moderation right now. Please convert the image or upload a PDF.",
      "UNSUPPORTED_IMAGE_TYPE",
      400,
    );
  }

  validateSupportedImageBytes(bytes, normalizedMimeType);
  const minConfidence = getMinConfidence();
  const blockedLabelSet = parseBlockLabels(readEnv("AWS_REKOGNITION_BLOCK_LABELS"));
  let response;

  try {
    response = await getClient().send(
      new DetectModerationLabelsCommand({
        Image: { Bytes: bytes },
        MinConfidence: minConfidence,
      }),
    );
  } catch (error) {
    const errorMessage = String(error?.message || "").toLowerCase();

    if (error?.name === "InvalidImageFormatException" || errorMessage.includes("invalid image format")) {
      throw createModerationError(
        "Only standard JPEG and PNG images are supported for AI content moderation right now. Please convert the image and try again.",
        "UNSUPPORTED_IMAGE_TYPE",
        400,
      );
    }

    if (
      ["AccessDeniedException", "UnrecognizedClientException", "InvalidSignatureException"].includes(error?.name) ||
      errorMessage.includes("security token") ||
      errorMessage.includes("credential") ||
      errorMessage.includes("signature")
    ) {
      throw createModerationError(
        "Content moderation is unavailable because AWS Rekognition credentials could not be used.",
        "MODERATION_AUTH_FAILED",
        503,
      );
    }

    throw error;
  }

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
