import { NextResponse } from "next/server";
import { Resend } from "resend";
import { moderateImageBytes, isImageMimeType } from "../../../lib/rekognitionModeration";

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

    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const attachment of attachments) {
      const contentType = inferAttachmentContentType(attachment);

      if (!isImageMimeType(contentType)) {
        continue;
      }

      const moderation = await moderateImageBytes({
        bytes: Buffer.from(attachment.content || "", "base64"),
        mimeType: contentType,
        source: `quote-attachment:${attachment.filename || "unnamed-file"}`,
      });

      if (!moderation.allowed) {
        return NextResponse.json(
          {
            error: `One or more uploaded images were blocked by AI content moderation: ${moderation.blockedLabels
              .map((label) => label.name)
              .join(", ")}`,
          },
          { status: 422 },
        );
      }
    }

    const { data, error } = await resend.emails.send({
      from,
      to: [destination],
      subject,
      html: message_html,
      attachments: attachments.map(({ filename, content }) => ({
        filename,
        content,
      })),
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
