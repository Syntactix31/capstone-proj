import { NextResponse } from "next/server";
import { Resend } from "resend";
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function scanImageModeration(base64Content, filename) {
  try {
    // Decode base64 to Buffer (Rekognition expects bytes)
    const buffer = Buffer.from(base64Content, "base64");
    
    const command = new DetectModerationLabelsCommand({
      Image: { Bytes: buffer },
      MinConfidence: 60, // Tune: 50-80 for balance
    });
    
    const result = await rekognition.send(command);
    const unsafeLabels = result.ModerationLabels?.filter(label => 
      label.ParentName === "Explicit" || 
      label.ParentName === "Violence" ||
      label.Confidence > 80
    ) || [];
    
    return {
      safe: unsafeLabels.length === 0,
      issues: unsafeLabels.map(l => `${l.Name} (${Math.round(l.Confidence)}%)`),
      filename
    };
  } catch (err) {
    console.error(`Rekognition scan failed for ${filename}:`, err);
    return { safe: false, issues: ["Scan error"], filename }; // Fail closed
  }
}

export async function POST(req) {
  try {
    const { to_email, subject, message_html, attachments = [] } = await req.json();
    
    // Step 1: Scan attachments for safety
    const scanResults = await Promise.all(
      attachments.map(async (att) => {
        if (!att.content || att.content.length < 1000) return null; // Skip tiny files
        
        // Handle images only (add MIME check if needed)
        if (!att.filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return { safe: true, filename: att.filename }; // Allow PDFs/docs
        }
        
        return scanImageModeration(att.content, att.filename);
      }).filter(Boolean)
    );
    
    // Step 2: Block if unsafe content found
    const unsafe = scanResults.filter(r => !r.safe);
    if (unsafe.length > 0) {
      return NextResponse.json({
        error: "Media safety check failed",
        details: unsafe.map(r => `${r.filename}: ${r.issues.join(", ")}`),
        blocked: true
      }, { status: 400 });
    }
    
    // Step 3: Proceed with email (original logic)
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "LandscapeCraftsmen@resend.dev",
      to: ["l3v1code@gmail.com"],
      subject,
      html: message_html,
      attachments,
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
