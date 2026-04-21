import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { recordAdminActivity } from "../../lib/admin/audit.js";
import { moderateImageBytes } from "../../lib/rekognitionModeration.js";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type?.startsWith("image/")) {
      const moderation = await moderateImageBytes({
        bytes: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
        source: `admin-gallery:${file.name}`,
      });

      if (!moderation.allowed) {
        return NextResponse.json(
          {
            error: "Upload blocked by AI content moderation",
            details: moderation.blockedLabels.map(
              (label) => `${label.name} (${Math.round(label.confidence)}%)`,
            ),
            blocked: true,
          },
          { status: 422 },
        );
      }
    }

    // Upload to vercel blob storage
    const newBlob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    await recordAdminActivity(req, {
      action: "Uploaded gallery media",
      details: `Uploaded media "${file.name}" to the gallery.`,
      metadata: { fileName: file.name, url: newBlob.url, pathname: newBlob.pathname },
    });

    return NextResponse.json({
      url: newBlob.url,
      pathname: newBlob.pathname,
    });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: error.status || 500 },
    );
  }
}



