// Clean env values in case they were copied with extra quotes/spaces.
function clean(value) {
  return String(value || "").trim().replace(/^"(.*)"$/, "$1");
}

// Read the Google OAuth client ID from env.
export function getGoogleOAuthClientId() {
  return clean(process.env.GOOGLE_OAUTH_CLIENT_ID);
}

// Read the Google OAuth client secret from env.
export function getGoogleOAuthClientSecret() {
  return clean(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}
