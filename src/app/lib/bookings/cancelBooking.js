import { getCalendarClient } from "../googleCalendar.js";
import { getGmailTransporter } from "../gmail.js";
import { findBookingByGoogleEventId, updateBookingByGoogleEventId } from "../db/bookings.js";

function isNotFoundError(error) {
  return error?.code === 404 || error?.status === 404 || error?.response?.status === 404;
}

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

function brand() {
  return {
    name: "Landscape Craftsmen",
    primary: "#166534",
    accent: "#16a34a",
    ownerEmail: process.env.OWNER_EMAIL || "",
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

function row(label, value) {
  return `
  <tr>
    <td style="padding:10px 12px; background:#f9fafb; border:1px solid #e5e7eb; width:170px; font-weight:700; color:#111827;">${escapeHtml(
      label
    )}</td>
    <td style="padding:10px 12px; border:1px solid #e5e7eb; color:#111827;">${escapeHtml(
      value || "-"
    )}</td>
  </tr>`;
}

function pill(text) {
  return `<span style="display:inline-block; padding:6px 10px; border-radius:999px; background:rgba(239,68,68,0.12); color:#991b1b; font-weight:700; font-size:12px;">${escapeHtml(
    text
  )}</span>`;
}

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

export async function cancelBookingWorkflow(eventId, storedBookingOverride = null) {
  if (!eventId) {
    const error = new Error("Missing eventId");
    error.status = 400;
    throw error;
  }

  const calendar = await getCalendarClient();
  const storedBooking = storedBookingOverride || (await findBookingByGoogleEventId(eventId));

  let event = null;
  try {
    event = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  const p = event?.data?.extendedProperties?.private || {};
  const firstName = p.firstName || storedBooking?.firstName || "there";
  const lastName = p.lastName || "";
  const email = p.email || storedBooking?.email || "";
  const service = p.service || event?.data?.summary || storedBooking?.service || "Appointment";

  const startIso = event?.data?.start?.dateTime || storedBooking?.startIso || null;
  const startDate = startIso ? new Date(startIso) : null;
  const startPretty =
    startDate && !Number.isNaN(startDate.getTime())
      ? formatPrettyDate(startDate)
      : "Scheduled time";

  try {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  await updateBookingByGoogleEventId(eventId, { status: "cancelled" });

  const canSendEmail = Boolean(process.env.OWNER_EMAIL && process.env.GMAIL_APP_PASSWORD);
  if (canSendEmail) {
    const transporter = getGmailTransporter();
    const attachments = [
      {
        filename: "Landscapecraftsmen_logo.jpg",
        path: process.cwd() + "/public/icons/Landscapecraftsmen_logo.jpg",
        cid: "companylogo",
      },
    ];

    if (email) {
      try {
        await transporter.sendMail({
          from: `"${brand().name}" <${process.env.OWNER_EMAIL}>`,
          to: email,
          subject: `Booking Cancelled - ${brand().name}`,
          html: cancelEmailCustomer({ firstName, service, startPretty }),
          attachments,
        });
      } catch (mailError) {
        console.error("CANCEL CUSTOMER EMAIL ERROR:", mailError);
      }
    }

    try {
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
        attachments,
      });
    } catch (mailError) {
      console.error("CANCEL OWNER EMAIL ERROR:", mailError);
    }
  }

  return { success: true };
}
