import { list } from "@vercel/blob";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MEDIA_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|mp4)$/i;

function normalizeMedia(items) {
  return items
    .filter((item) => MEDIA_EXTENSIONS.test(item.pathname))
    .map((item) => ({
      src: item.src,
      type: /\.mp4$/i.test(item.pathname) ? "video" : "image",
      poster: undefined,
      pathname: item.pathname,
      uploadedAt: item.uploadedAt,
    }))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

async function readBundledProjectMedia() {
  const projectsDir = path.join(process.cwd(), "public", "projects");
  const fileNames = await readdir(projectsDir);

  const items = await Promise.all(
    fileNames
      .filter((fileName) => MEDIA_EXTENSIONS.test(fileName))
      .map(async (fileName) => {
        const fileStats = await stat(path.join(projectsDir, fileName));

        return {
          src: `/projects/${fileName}`,
          pathname: fileName,
          uploadedAt: fileStats.mtime.toISOString(),
        };
      })
  );

  return normalizeMedia(items);
}

async function readBlobProjectMedia() {
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.PDF_READ_WRITE_TOKEN;

  if (!token) {
    return [];
  }

  const { blobs } = await list({
    prefix: "",
    limit: 200,
    token,
  });

  return normalizeMedia(
    blobs.map((blob) => ({
      src: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
    }))
  );
}

export async function GET() {
  try {
    let media = [];

    try {
      media = await readBlobProjectMedia();
      if (media.length > 0) {
        console.log(`ScanMedia loaded ${media.length} items from blob storage`);
      }
    } catch (blobError) {
      console.warn("ScanMedia blob lookup failed; falling back to bundled media.", blobError);
    }

    if (media.length === 0) {
      media = await readBundledProjectMedia();
      console.log(`ScanMedia loaded ${media.length} items from public/projects`);
    }

    return NextResponse.json(media.slice(0, 23), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    console.error("ScanMedia error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
