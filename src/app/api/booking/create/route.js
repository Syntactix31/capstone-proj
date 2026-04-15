import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";
import { getGmailTransporter } from "../../../lib/gmail";
import { recordAdminActivity } from "../../../lib/admin/audit.js";
import { createBooking } from "../../../lib/db/bookings";
import { fetchClientById, upsertClient, upsertClientProperty } from "../../../lib/db/clients";
import { createProject, findProjectById, listProjects } from "../../../lib/db/projects";
import {
  FIELD_LIMITS,
  sanitizeEmail,
  sanitizeLetters,
  sanitizePhone,
  sanitizeTextArea,
} from "../../../lib/validation/fields.js";

const EDMONTON_TIME_ZONE = "America/Edmonton";
const EDMONTON_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeDurationHours(value) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), 8);
}

// Turn a "9:30 am" style label into numeric hour/minute values.
function parseTime12h(timeStr) {
  const match = String(timeStr || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toLowerCase();

  if (hours < 1 || hours > 12) return null;
  if (minutes < 0 || minutes > 59) return null;

  if (meridiem === "am") {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }
  return { hours, minutes };
}

// Build a real Date object from the selected booking date/time.
function buildEdmontonDate(dateStr, timeStr) {
  const t = parseTime12h(timeStr);
  if (!t) return null;

  const yyyyMmDd = String(dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;

  const [year, month, day] = yyyyMmDd.split("-").map((value) => Number(value));

  let utcMillis = Date.UTC(year, month - 1, day, t.hours, t.minutes, 0);

  for (let i = 0; i < 3; i += 1) {
    const parts = EDMONTON_PARTS_FORMATTER.formatToParts(new Date(utcMillis));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const zonedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      0
    );
    const desiredAsUtc = Date.UTC(year, month - 1, day, t.hours, t.minutes, 0);
    const diffMs = desiredAsUtc - zonedAsUtc;
    if (diffMs === 0) break;
    utcMillis += diffMs;
  }

  return new Date(utcMillis);
}

// Format appointment dates nicely for customer/owner emails.
function formatPrettyDate(dateObj) {
  return dateObj.toLocaleString("en-CA", {
    timeZone: EDMONTON_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Shared branding values for the booking emails.
function brand() {
  return {
    name: "Landscape Craftsmen",
    primary: "#166534",
    accent: "#16a34a",
    ownerEmail: process.env.OWNER_EMAIL || "",
  };
}

function siteLoginUrl() {
  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  return siteUrl ? `${siteUrl}/login` : "/login";
}

// Escape user input before placing it inside HTML email markup.
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Outer HTML layout shared by the booking emails.
function emailShell({ title, preheader, bodyHtml }) {
  const b = brand();

  const logo = `
    <img 
      src="cid:companylogo"
      width="160"
      alt="Landscape Craftsmen Logo"
      style="display:block;"
    />
  `;

  const hiddenPreheader = preheader
    ? `<div style="display:none!important; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${escapeHtml(
        preheader
      )}</div>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f3f4f6;">
    ${hiddenPreheader}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6; padding:24px 12px;">
      <tr>
        <td align="center">

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px; width:100%;">
            <tr>
              <td style="padding:0 0 14px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px; overflow:hidden;">
                  <tr>
                    <td style="background:${b.primary}; padding:18px 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="width:54px; vertical-align:middle;">
                            ${logo}
                          </td>
                          <td style="vertical-align:middle; padding-left:14px; color:#fff; font-family:Arial,sans-serif;">
                            <div style="font-size:14px; font-weight:700; letter-spacing:0.2px;">${escapeHtml(
                              b.name
                            )}</div>
                            <div style="font-size:13px; opacity:0.9; margin-top:2px;">Appointment Booking</div>
                          </td>
                          <td style="vertical-align:middle; text-align:right; color:#fff; font-family:Arial,sans-serif;">
                            <div style="font-size:12px; opacity:0.9;">${escapeHtml(
                              new Date().toLocaleDateString("en-CA")
                            )}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="background:#ffffff; padding:22px 22px 10px 22px; font-family:Arial,sans-serif; color:#111827;">
                      <div style="font-size:18px; font-weight:700; margin:0 0 10px 0;">${escapeHtml(
                        title
                      )}</div>
                      ${bodyHtml}
                    </td>
                  </tr>

                  <tr>
                    <td style="background:#ffffff; padding:10px 22px 22px 22px; font-family:Arial,sans-serif; color:#6b7280;">
                      <div style="border-top:1px solid #e5e7eb; padding-top:14px; font-size:12px; line-height:1.5;">
                        <div style="margin-bottom:4px;"><strong style="color:#111827;">${escapeHtml(
                          b.name
                        )}</strong></div>
                        <div style="margin-bottom:4px;">This email was sent by the booking system.</div>
                        ${
                          b.ownerEmail
                            ? `<div>Contact: <a href="mailto:${escapeHtml(
                                b.ownerEmail
                              )}" style="color:${b.accent}; text-decoration:none;">${escapeHtml(
                                b.ownerEmail
                              )}</a></div>`
                            : ""
                        }
                      </div>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Reusable table row for booking email details.
function row(label, value) {
  return `
  <tr>
    <td style="padding:10px 12px; background:#f9fafb; border:1px solid #e5e7eb; width:170px; font-weight:700; color:#111827;">${escapeHtml(
      label
    )}</td>
    <td style="padding:10px 12px; border:1px solid #e5e7eb; color:#111827;">${escapeHtml(
      value || "—"
    )}</td>
  </tr>`;
}

// Reusable status pill used in the booking emails.
function pill(text, tone = "success") {
  const b = brand();
  const styles =
    tone === "danger"
      ? `background:rgba(239,68,68,0.12); color:#991b1b;`
      : `background:rgba(22,163,74,0.10); color:${b.primary};`;
  return `<span style="display:inline-block; padding:6px 10px; border-radius:999px; ${styles} font-weight:700; font-size:12px;">${escapeHtml(
    text
  )}</span>`;
}

// Customer confirmation email content.
function emailTemplateCustomer({ firstName, service, startPretty, address }) {
  const loginUrl = siteLoginUrl();
  const bodyHtml = `
    <div style="font-size:14px; color:#374151; margin:0 0 14px 0;">
      Hi <strong style="color:#111827;">${escapeHtml(
        firstName
      )}</strong>, your appointment is confirmed. ${pill("Confirmed")}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin:12px 0 16px 0; border-radius:12px; overflow:hidden;">
      ${row("Service", service)}
      ${row("Date & Time", startPretty)}
      ${row("Address", address)}
    </table>

    <div style="font-size:13px; color:#374151; margin:0;">
      If you need to cancel, sign in at <a href="${escapeHtml(
        loginUrl
      )}" style="color:${brand().accent}; text-decoration:none;">${escapeHtml(
        loginUrl
      )}</a> and open your appointments page, or reply to this email.
    </div>
  `;

  return emailShell({
    title: "Booking Confirmed",
    preheader: `Your appointment is confirmed for ${startPretty}.`,
    bodyHtml,
  });
}

// Owner notification email content.
function emailTemplateOwner({
  firstName,
  lastName,
  email,
  service,
  startPretty,
  address,
  notes,
}) {
  const bodyHtml = `
    <div style="font-size:14px; color:#374151; margin:0 0 14px 0;">
      A new booking was created. ${pill("New Booking")}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin:12px 0 16px 0; border-radius:12px; overflow:hidden;">
      ${row("Client", `${firstName} ${lastName}`.trim())}
      ${row("Client Email", email)}
      ${row("Service", service)}
      ${row("Date & Time", startPretty)}
      ${row("Address", address)}
      ${row("Notes", notes || "None")}
    </table>
  `;

  return emailShell({
    title: "New Booking Received",
    preheader: `New booking for ${startPretty}.`,
    bodyHtml,
  });
}

// Create the booking across Google Calendar, Postgres, and email notifications.
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      service,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      visitType,
      durationHours,
      address,
      notes,
      clientId,
      projectId,
    } = body;

    const normalizedPhone = sanitizePhone(phone);
    const normalizedDurationHours = normalizeDurationHours(durationHours);
    const normalizedVisitType = String(visitType || "Estimate").trim() || "Estimate";
    const normalizedFirstName = sanitizeLetters(firstName, FIELD_LIMITS.name).trim();
    const normalizedLastName = sanitizeLetters(lastName, FIELD_LIMITS.name).trim();
    const normalizedEmail = sanitizeEmail(email).trim();
    const normalizedService = sanitizeTextArea(service, FIELD_LIMITS.serviceName).trim();
    const normalizedAddress = sanitizeTextArea(address, FIELD_LIMITS.address).trim();
    const normalizedNotes = sanitizeTextArea(notes, FIELD_LIMITS.notes).trim();

    if (!date || !time || !normalizedEmail || !normalizedFirstName || !normalizedService) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Phone number must be 10 digits." }, { status: 400 });
    }

    const start = buildEdmontonDate(date, time);
    if (!start || Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }

    if (start.getTime() < Date.now()) {
      return NextResponse.json({ error: "Cannot book in the past." }, { status: 400 });
    }

    const end = new Date(start.getTime() + normalizedDurationHours * 60 * 60 * 1000);

    const calendar = await getCalendarClient();

    const existing = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(start.getTime() - 1).toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
    });

    if ((existing.data.items || []).length > 0) {
      return NextResponse.json({ error: "This time slot is already booked." }, { status: 409 });
    }

    const startPretty = formatPrettyDate(start);

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${service} – ${firstName} ${lastName}`,
        location: normalizedAddress || "Calgary, AB",
        description: [
          `Visit Type: ${normalizedVisitType}`,
          `Name: ${normalizedFirstName} ${normalizedLastName}`,
          `Email: ${normalizedEmail}`,
          `Phone: ${normalizedPhone || "N/A"}`,
          `Duration: ${normalizedDurationHours} ${normalizedDurationHours === 1 ? "hour" : "hours"}`,
          `Address: ${normalizedAddress || "N/A"}`,
          `Notes: ${normalizedNotes || "None"}`,
        ].join("\n"),
        extendedProperties: {
          private: {
            service: normalizedService,
            visitType: normalizedVisitType,
            durationHours: String(normalizedDurationHours),
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            email: normalizedEmail,
            phone: String(normalizedPhone || ""),
            address: normalizedAddress,
            notes: normalizedNotes,
            date: String(date || ""),
            time: String(time || ""),
          },
        },
        start: { dateTime: start.toISOString(), timeZone: "America/Edmonton" },
        end: { dateTime: end.toISOString(), timeZone: "America/Edmonton" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 * 24 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });

    const client =
      (clientId ? await fetchClientById(String(clientId)) : null) ||
      (await upsertClient({
        name: `${normalizedFirstName} ${normalizedLastName}`.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
      }));

    const property = await upsertClientProperty({
      clientId: client.id,
      address: normalizedAddress,
    });

    let linkedProject = null;
    if (projectId) {
      linkedProject = await findProjectById(String(projectId));
      if (!linkedProject || linkedProject.clientId !== client.id) {
        return NextResponse.json({ error: "Invalid project selected." }, { status: 400 });
      }
    } else if (normalizedVisitType !== "Estimate") {
      const existingProjects = await listProjects({ clientId: client.id });
      if (existingProjects.length === 0) {
        linkedProject = await createProject({
          clientId: client.id,
          service: normalizedService,
          address: normalizedAddress || property?.address || client.address || "",
          generateQuote: false,
        });
      }
    }

    await createBooking({
      clientId: client.id,
      projectId: linkedProject?.id || null,
      propertyId: property?.id || null,
      service: normalizedService,
      visitType: normalizedVisitType,
      bookingDate: date,
      bookingTime: time,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      notes: normalizedNotes,
      googleEventId: event.data.id,
    });

    await recordAdminActivity(req, {
      action: "Created appointment",
      details: `Created ${normalizedVisitType.toLowerCase()} appointment for ${normalizedFirstName} ${normalizedLastName}`.trim() + ` on ${date} at ${time}.`,
      metadata: {
        bookingEventId: event.data.id,
        clientId: client.id,
        projectId: linkedProject?.id || null,
        service: normalizedService,
        date,
        time,
      },
    });

    const transporter = getGmailTransporter();

    await transporter.sendMail({
      from: `"${brand().name}" <${process.env.OWNER_EMAIL}>`,
      to: normalizedEmail,
      subject: `Booking Confirmed – ${brand().name}`,
      html: emailTemplateCustomer({ firstName: normalizedFirstName, service: normalizedService, startPretty, address: normalizedAddress }),
      attachments: [
        {
          filename: "Landscapecraftsmen_logo.jpg",
          path: process.cwd() + "/public/icons/Landscapecraftsmen_logo.jpg",
          cid: "companylogo",
        },
      ],
    });

    await transporter.sendMail({
      from: `"${brand().name} Booking System" <${process.env.OWNER_EMAIL}>`,
      to: process.env.OWNER_EMAIL,
      subject: "New Booking Received",
      html: emailTemplateOwner({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        service: normalizedService,
        startPretty,
        address: normalizedAddress,
        notes: normalizedNotes,
      }),
      attachments: [
        {
          filename: "Landscapecraftsmen_logo.jpg",
          path: process.cwd() + "/public/icons/Landscapecraftsmen_logo.jpg",
          cid: "companylogo",
        },
      ],
    });

    return NextResponse.json({ success: true, eventId: event.data.id });
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
