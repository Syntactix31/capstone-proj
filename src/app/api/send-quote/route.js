import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to_email, subject, message_html } = await req.json();

    const { error } = await resend.emails.send({
      from: "LandscapeCraftsmen@resend.dev",
      to: ["l3v1code@gmail.com"],
      subject,
      html: message_html,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ error: "Server crash" }, { status: 500 });
  }
}


