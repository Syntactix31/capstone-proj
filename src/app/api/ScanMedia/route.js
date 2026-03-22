import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const { blobs } = await list({ 
      prefix: '', 
      limit: 200  
    });

    console.log(`Found ${blobs.length} total blobs`); // Debug log

    const media = blobs
      //  acceptance filter - matches ANY image/video extension pathname
      .filter(blob => {
        const extMatch = blob.pathname.match(/\.(jpg|jpeg|png|gif|webp|mp4)$/i);
        console.log(`Blob: ${blob.pathname} -> ${extMatch ? 'MATCH' : 'NO MATCH'}`);
        return extMatch;
      })
      .map(blob => {
        const type = blob.pathname.match(/\.mp4$/i) ? 'video' : 'image';
        return { 
          src: blob.url,
          type,
          poster: undefined,
          pathname: blob.pathname,  
          uploadedAt: blob.uploadedAt
        };
      });

    console.log(`Filtered to ${media.length} media items`);

    // Sort newest first (change later bc the videos should be first)
    media.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return NextResponse.json(media.slice(0, 23), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (err) {
    console.error('ScanMedia error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

