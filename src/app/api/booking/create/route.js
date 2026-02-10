import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";
import { getGmailTransporter } from "../../../lib/gmail";


export async function POST(req) {
  try {
    const body = await req.json();

    const {
      service,
      day,
      time,
      firstName,
      lastName,
      email,
      address,
      notes,
    } = body;

    if (!day || !time || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build date (October 2026, Calgary time) hard coded for now because front end is weird
    const start = new Date(`2026-10-${day} ${time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const calendar = await getCalendarClient();

    // Check for conflicts
    const existing = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
    });

    if (existing.data.items.length > 0) {
      return NextResponse.json(
        { error: "This time slot is already booked." },
        { status: 409 }
      );
    }

    // Creates event
    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${service} - ${firstName} ${lastName}`,
        description: `
Name: ${firstName} ${lastName}
Email: ${email}
Address: ${address}
Notes: ${notes || "None"}
        `,
        start: {
          dateTime: start.toISOString(),
          timeZone: "America/Edmonton",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "America/Edmonton",
        },
      },
    });


const transporter = getGmailTransporter();

// Email customer
await transporter.sendMail({
  from: `"Landscape Craftsmen" <${process.env.OWNER_EMAIL}>`,
  to: email,
  subject: "Booking Confirmed – Landscape Craftsmen",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
      <h2 style="color:#2f855a;">Booking Confirmed</h2>

      <p>Hi ${firstName},</p>

      <p>Thank you for choosing <strong>Landscape Craftsmen</strong>.
      Your booking has been successfully confirmed.</p>

      <table style="margin-top: 15px;">
        <tr>
          <td><strong>Service:</strong></td>
          <td>${service}</td>
        </tr>
        <tr>
          <td><strong>Date & Time:</strong></td>
          <td>${start.toLocaleString("en-CA", {
            timeZone: "America/Edmonton",
          })}</td>
        </tr>
        <tr>
          <td><strong>Address:</strong></td>
          <td>${address}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        If you need to make any changes or have questions,
        please contact us through our website.
      </p>

      <p style="margin-top: 30px;">
        — <br />
        <strong>Landscape Craftsmen</strong><br />
        Professional Lawn & Landscape Services
      </p>
    </div>
  `,
});


// Email owner
await transporter.sendMail({
  from: `"Landscape Craftsmen Booking System" <${process.env.OWNER_EMAIL}>`,
  to: process.env.OWNER_EMAIL,
  subject: "New Booking Received",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
      <h2>New Booking</h2>

      <p>A new service booking has been received.</p>

      <table style="margin-top: 15px;">
        <tr>
          <td><strong>Client:</strong></td>
          <td>${firstName} ${lastName}</td>
        </tr>
        <tr>
          <td><strong>Email:</strong></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td><strong>Service:</strong></td>
          <td>${service}</td>
        </tr>
        <tr>
          <td><strong>Date & Time:</strong></td>
          <td>${start.toLocaleString("en-CA", {
            timeZone: "America/Edmonton",
          })}</td>
        </tr>
        <tr>
          <td><strong>Address:</strong></td>
          <td>${address}</td>
        </tr>
        <tr>
          <td><strong>Notes:</strong></td>
          <td>${notes || "None"}</td>
        </tr>
      </table>
    </div>
  `,
});



    return NextResponse.json({
      success: true,
      eventId: event.data.id,
    });
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
