import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";
import { getGmailTransporter } from "../../../lib/gmail";
import { findBookingByGoogleEventId, updateBookingByGoogleEventId } from "../../../lib/db/bookings";

// Format appointment dates nicely for cancellation emails.
function formatPrettyDate(dateObj) {
  return dateObj.toLocaleString("en-CA", {
    timeZone: "America/Edmonton",
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

// Outer HTML layout shared by the cancellation emails.
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

// Reusable table row for cancellation email details.
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

// Reusable status pill used in the cancellation emails.
function pill(text) {
  return `<span style="display:inline-block; padding:6px 10px; border-radius:999px; background:rgba(239,68,68,0.12); color:#991b1b; font-weight:700; font-size:12px;">${escapeHtml(
    text
  )}</span>`;
}

// Customer cancellation email content.
function cancelEmailCustomer({ firstName, service, startPretty }) {
  const bodyHtml = `
    <div style="font-size:14px; color:#374151; margin:0 0 14px 0;">
      Hi <strong style="color:#111827;">${escapeHtml(
        firstName
      )}</strong>, your appointment has been cancelled. ${pill("Cancelled")}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin:12px 0 16px 0; border-radius:12px; overflow:hidden;">
      ${row("Service", service)}
      ${row("Date & Time", startPretty)}
    </table>

    <div style="font-size:13px; color:#374151; margin:0;">
      If you still need an estimate, you can book a new appointment anytime.
    </div>
  `;

  return emailShell({
    title: "Booking Cancelled",
    preheader: `Your appointment for ${startPretty} has been cancelled.`,
    bodyHtml,
  });
}

// Owner cancellation email content.
function cancelEmailOwner({ fullName, email, service, startPretty }) {
  const bodyHtml = `
    <div style="font-size:14px; color:#374151; margin:0 0 14px 0;">
      A booking was cancelled. ${pill("Cancelled")}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; margin:12px 0 16px 0; border-radius:12px; overflow:hidden;">
      ${row("Client", fullName)}
      ${row("Client Email", email)}
      ${row("Service", service)}
      ${row("Date & Time", startPretty)}
    </table>
  `;

  return emailShell({
    title: "Booking Cancelled",
    preheader: `A booking for ${startPretty} was cancelled.`,
    bodyHtml,
  });
}

// Cancel the booking in Google Calendar, update Postgres, and send emails.
export async function POST(req) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const calendar = await getCalendarClient();
    const storedBooking = await findBookingByGoogleEventId(eventId);

    const event = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });

    const p = event.data.extendedProperties?.private || {};
    const firstName = p.firstName || "there";
    const lastName = p.lastName || "";
    const email = p.email || "";
    const service = p.service || event.data.summary || "Appointment";

    const startIso = event.data.start?.dateTime;
    const startDate = startIso ? new Date(startIso) : null;
    const startPretty =
      startDate && !Number.isNaN(startDate.getTime())
        ? formatPrettyDate(startDate)
        : "Scheduled time";

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });

    await updateBookingByGoogleEventId(eventId, { status: "cancelled" });

    const transporter = getGmailTransporter();

    if (email) {
      await transporter.sendMail({
        from: `"${brand().name}" <${process.env.OWNER_EMAIL}>`,
        to: email,
        subject: `Booking Cancelled – ${brand().name}`,
        html: cancelEmailCustomer({ firstName, service, startPretty }),
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
      subject: "Booking Cancelled",
      html: cancelEmailOwner({
        fullName: `${firstName} ${lastName}`.trim() || storedBooking?.client || "Unknown",
        email: email || storedBooking?.email || "Unknown",
        service: service || storedBooking?.service || "Appointment",
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CANCEL ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
