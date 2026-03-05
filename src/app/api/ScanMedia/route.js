import { readdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const folderPath = path.join(process.cwd(), "public/projects");
    const files = await readdir(folderPath);

    // Only accept images and mp4 videos
    const media = files
      .filter((f) => /\.(jpg|jpeg|png|gif|mp4)$/i.test(f))
      .map((f) => {
        const type = /\.mp4$/i.test(f) ? "video" : "image";
        const poster = type === "video" ? `/projects/${f}-poster.jpg` : undefined;
        return { src: `/projects/${f}`, type, poster };
      });

    //Sort: videos first, then images
    media.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === "video" ? -1 : 1;
    });

    return new Response(JSON.stringify(media), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}