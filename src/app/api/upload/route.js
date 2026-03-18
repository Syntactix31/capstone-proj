import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const fileName = `${Date.now()}-${file.name}`;

  // Save to public/projects
  const filePath = path.join(process.cwd(), "public/projects", fileName);

  await writeFile(filePath, buffer);

  return Response.json({
    url: `/projects/${fileName}`, 
  });
}


// Code to work on
// import { list } from "@vercel/blob";
 
// export async function GET() {
//   const { blobs } = await list();
 
//   const media = blobs.map((b) => ({
//     src: b.url,
//     type: b.pathname.endsWith(".mp4") ? "video" : "image"
//   }));
 
//   return Response.json(media);
// }



