import { readdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const folderPath = path.join(process.cwd(), "public/projects");
    const files = await readdir(folderPath);

    // Only accept images and mp4 videos
    const videos = files.filter((f) => /\.mp4$/i.test(f));
    const images = files.filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));

    // Map videos to posters (poster1.jpg, poster2.jpg, etc.)
    const mediaVideos = videos.map((vid, i) => ({
      src: `/projects/${vid}`,
      type: "video",
      poster: `/projects/Post${i + 1}.jpg`,
    }));

    // Map images
    const mediaImages = images.map((img) => ({
      src: `/projects/${img}`,
      type: "image",
    }));

    // Videos first, then images
    const media = [...mediaVideos, ...mediaImages];

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