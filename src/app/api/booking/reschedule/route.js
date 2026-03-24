import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";
import { getGmailTransporter } from "../../../lib/gmail";
import { findBookingByGoogleEventId, updateBookingByGoogleEventId } from "../../../lib/db/bookings";
import { upsertClientProperty } from "../../../lib/db/clients";

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

// Format appointment dates nicely for reschedule emails.
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

// Escape user input before placing it inside HTML email markup.
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Outer HTML layout shared by the reschedule emails.
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

// Reusable table row for reschedule email details.
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

// Reusable status pill used in the reschedule emails.
function pill(text) {
  const b = brand();
  return `<span style="display:inline-block; padding:6px 10px; border-radius:999px; background:rgba(22,163,74,0.10); color:${b.primary}; font-weight:700; font-size:12px;">${escapeHtml(
    text
  )}</span>`;
}

// Customer reschedule email content.
function rescheduleEmailCustomer({ firstName, service, startPretty }) {
  const bodyHtml = `
    <div style="font-size:14px; color:#374151; margin:0 0 14px 0;">
      Hi <strong style="color:#111827;">${escapeHtml(
        firstName
      )}</strong>, your appointment has been rescheduled. ${pill("Rescheduled")}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin:12px 0 16px 0; border-radius:12px; overflow:hidden;">
      ${row("Service", service)}
      ${row("New Date & Time", startPretty)}
    </table>

    <div style="font-size:13px; color:#374151; margin:0;">
      If you have questions, reply to this email.
    </div>
  `;

  return emailShell({
    title: "Booking Rescheduled",
    preheader: `Your appointment has been rescheduled to ${startPretty}.`,
    bodyHtml,
  });
}

// Owner reschedule email content.
function rescheduleEmailOwner({ fullName, email, service, startPretty }) {
  const bodyHtml = `
    <div style="font-size:14px; color:#374151; margin:0 0 14px 0;">
      A booking was rescheduled. ${pill("Rescheduled")}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin:12px 0 16px 0; border-radius:12px; overflow:hidden;">
      ${row("Client", fullName)}
      ${row("Client Email", email)}
      ${row("Service", service)}
      ${row("New Date & Time", startPretty)}
    </table>
  `;

  return emailShell({
    title: "Booking Rescheduled",
    preheader: `A booking has been moved to ${startPretty}.`,
    bodyHtml,
  });
}

// Move the booking to a new time in Google Calendar and Postgres, then email updates.
export async function POST(req) {
  try {
    const { eventId, newDate, newTime } = await req.json();

    if (!eventId || !newDate || !newTime) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const start = buildEdmontonDate(newDate, newTime);
    if (!start || Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }

    if (start.getTime() < Date.now()) {
      return NextResponse.json({ error: "Cannot reschedule into the past." }, { status: 400 });
    }

    const calendar = await getCalendarClient();

    const oldEvent = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });
    const storedBooking = await findBookingByGoogleEventId(eventId);

    const originalStart = new Date(storedBooking?.startIso || oldEvent.data.start?.dateTime || "");
    const originalEnd = new Date(storedBooking?.endIso || oldEvent.data.end?.dateTime || "");
    const durationMs =
      !Number.isNaN(originalStart.getTime()) &&
      !Number.isNaN(originalEnd.getTime()) &&
      originalEnd.getTime() > originalStart.getTime()
        ? originalEnd.getTime() - originalStart.getTime()
        : 60 * 60 * 1000;
    const end = new Date(start.getTime() + durationMs);

    const p = oldEvent.data.extendedProperties?.private || {};

    const firstName = p.firstName || "there";
    const lastName = p.lastName || "";
    const email = p.email || "";
    const service = p.service || oldEvent.data.summary || "Appointment";
    const visitType = p.visitType || "";
    const durationHours = p.durationHours || "";
    const address = p.address || oldEvent.data.location || "Calgary, AB";
    const notes = p.notes || "";

    const existing = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(start.getTime() - 1).toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
    });

    const items = existing.data.items || [];
    const conflicts = items.filter((e) => e.id !== eventId);
    if (conflicts.length > 0) {
      return NextResponse.json({ error: "That time is already booked." }, { status: 409 });
    }

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });

    const startPretty = formatPrettyDate(start);

    const newEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${service} – ${firstName} ${lastName}`.trim(),
        location: address,
        description: [
          ...(visitType ? [`Visit Type: ${visitType}`] : []),
          `Name: ${firstName} ${lastName}`.trim(),
          `Email: ${email}`,
          ...(durationHours ? [`Duration: ${durationHours} ${durationHours === "1" ? "hour" : "hours"}`] : []),
          `Address: ${address || "N/A"}`,
          `Notes: ${notes || "None"}`,
          `Rescheduled: Yes`,
        ].join("\n"),
        extendedProperties: {
          private: {
            service: String(service || ""),
            visitType: String(visitType || ""),
            durationHours: String(durationHours || ""),
            firstName: String(firstName || ""),
            lastName: String(lastName || ""),
            email: String(email || ""),
            address: String(address || ""),
            notes: String(notes || ""),
            date: String(newDate || ""),
            time: String(newTime || ""),
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

    const property = storedBooking?.clientId
      ? await upsertClientProperty({
          clientId: storedBooking.clientId,
          address: address || storedBooking.address,
        })
      : null;

    await updateBookingByGoogleEventId(eventId, {
      propertyId: property?.id || storedBooking?.propertyId || null,
      visitType,
      bookingDate: newDate,
      bookingTime: newTime,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      notes,
      googleEventId: newEvent.data.id,
      status: "confirmed",
    });

    const transporter = getGmailTransporter();

    if (email) {
      await transporter.sendMail({
        from: `"${brand().name}" <${process.env.OWNER_EMAIL}>`,
        to: email,
        subject: `Booking Rescheduled – ${brand().name}`,
        html: rescheduleEmailCustomer({ firstName, service, startPretty }),
        attachments: [
          {
            filename: "Landscapecraftsmen_logo.jpg",
            path: process.cwd() + "/public/icons/Landscapecraftsmen_logo.jpg",
            cid: "companylogo",
          },
        ],
      });
    }

    await transporter.sendMail({
      from: `"${brand().name} Booking System" <${process.env.OWNER_EMAIL}>`,
      to: process.env.OWNER_EMAIL,
      subject: "Booking Rescheduled",
      html: rescheduleEmailOwner({
        fullName: `${firstName} ${lastName}`.trim(),
        email: email || "Unknown",
        service,
        startPretty,
      }),
      attachments: [
        {
          filename: "Landscapecraftsmen_logo.jpg",
          path: process.cwd() + "/public/icons/Landscapecraftsmen_logo.jpg",
          cid: "companylogo",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      newEventId: newEvent.data.id,
      date: newDate,
      time: newTime,
    });
  } catch (err) {
    console.error("RESCHEDULE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
