import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list({ 
      prefix: ''
    });

    const media = blobs
      .filter(blob => 
        blob.pathname.match(/\.(jpg|jpeg|png|gif|mp4)$/i)
      )
      .map(blob => {
        const type = blob.pathname.match(/\.mp4$/i) ? 'video' : 'image';
        return { 
          src: blob.url,
          type,
          poster: undefined 
        };
      });

    media.sort((a, b) => a.type === 'video' ? -1 : 1);

    return Response.json(media.slice(0, 23));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

