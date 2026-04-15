import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { recordAdminActivity } from "../../lib/admin/audit.js";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



