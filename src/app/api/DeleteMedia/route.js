import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req) {
  console.log("🔥 DELETE API HIT");

  try {
    const formData = await req.formData();
    const url = formData.get('url');

    console.log("URL RECEIVED:", url);

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "No valid URL provided" },
        { status: 400 }
      );
    }

    // Delete the file from Vercel Blob
    await del(url);

    console.log("✅ DELETE SUCCESS");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}