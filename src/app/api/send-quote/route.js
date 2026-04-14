import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req) {
  try {
    const { to_email, subject, message_html, attachments = [] } = await req.json();
    const from = process.env.RESEND_FROM_EMAIL || "LandscapeCraftsmen@resend.dev";
    const destination = process.env.QUOTE_TO_EMAIL || process.env.OWNER_EMAIL;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
    }

    if (!destination) {
      return NextResponse.json(
        { error: "Missing QUOTE_TO_EMAIL or OWNER_EMAIL for quote delivery" },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from,
      to: [destination],
      subject,
      html: message_html,
      attachments,
      replyTo: to_email || undefined,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ error: "Server crash" }, { status: 500 });
  }
}

