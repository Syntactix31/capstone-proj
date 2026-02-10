import { google } from "googleapis";

export async function getCalendarClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error("Missing Google Calendar credentials");
  }

  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  await auth.authorize();

  return google.calendar({ version: "v3", auth });
}
