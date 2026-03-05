function clean(value) {
  return String(value || "").trim().replace(/^"(.*)"$/, "$1");
}

export function getGoogleOAuthClientId() {
  return clean(process.env.GOOGLE_OAUTH_CLIENT_ID);
}

export function getGoogleOAuthClientSecret() {
  return clean(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}
