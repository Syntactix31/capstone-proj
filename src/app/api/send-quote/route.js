import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isImageMimeType, moderateImageBytes } from "../../lib/rekognitionModeration.js";

function inferAttachmentContentType(attachment = {}) {
  if (attachment.contentType) return attachment.contentType;

  const filename = String(attachment.filename || "").toLowerCase();
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".pdf")) return "application/pdf";

  return "";
}

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

    // **FIX: Check ALL attachments, block if ANY image fails moderation**
    for (const attachment of attachments) {
      const contentType = inferAttachmentContentType(attachment);

      // **FIX: Only moderate if it's an image (skip PDFs/docs)**
      if (isImageMimeType(contentType)) {
        const moderation = await moderateImageBytes({
          bytes: Buffer.from(attachment.content || "", "base64"),
          mimeType: contentType,
          source: `quote-attachment:${attachment.filename || "unnamed-file"}`,
        });

        if (!moderation.allowed) {
          return NextResponse.json(
            {
              error: "Media safety check failed",
              details: moderation.blockedLabels.map(
                (label) => `${attachment.filename}: ${label.name} (${Math.round(label.confidence)}%)`,
              ),
              blocked: true,
            },
            { status: 422 },
          );
        }
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to: [destination],
      subject,
      html: message_html,
      attachments: attachments.map(({ filename, content }) => ({ filename, content })),
      replyTo: to_email || undefined,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message || "Failed to send quote email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: err.message || "Server crash" },
      { status: err.status || 500 },
    );
  }
}

