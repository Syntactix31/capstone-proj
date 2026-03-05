import { readdir } from "fs/promises";
import path from "path";
import { stat } from "fs/promises";

export async function GET() {
  try {
    const folderPath = path.join(process.cwd(), "public/projects");
    const files = await readdir(folderPath);

    // Only accept images and mp4 videos
    const media = await Promise.all(
      files
        .filter((f) => /\.(jpg|jpeg|png|gif|mp4)$/i.test(f))
        .map(async (f) => {
          const type = /\.mp4$/i.test(f) ? "video" : "image";
          
          if (type === "image") {
            return { src: `/projects/${f}`, type, poster: undefined };
          }

          const nameWithoutExt = f.replace(/\.[^/.]+$/, ""); 
          const numberMatch = nameWithoutExt.match(/(\d+)$/); 
          
          if (numberMatch) {
            const videoNumber = numberMatch[1];
            const posterCandidates = [
              `Post${videoNumber}.jpg`,
              `Post${videoNumber}.JPG`, 
              `Post${videoNumber}.png`,
              `Post${videoNumber}.PNG`
            ];
            
            for (const posterName of posterCandidates) {
              try {
                await stat(path.join(folderPath, posterName));
                return {
                  src: `/projects/${f}`,
                  type: "video",
                  poster: `/projects/${posterName}`
                };
              } catch {
                // Poster doesn't exist, try next
              }
            }
          }
          
          return {
            src: `/projects/${f}`,
            type: "video",
            poster: undefined
          };
        })
    );

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
