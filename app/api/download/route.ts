import { NextRequest } from 'next/server';
import { addDownload, updateStats } from '@/lib/database';
import { downloadMedia } from '@/lib/downloaders';
import { validateUrl } from '@/lib/validators';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url, platform, format, converterId } = await request.json();

    if (!url || !platform || !format) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL
    const validation = validateUrl(url, platform);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error || 'Invalid URL' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Starting download: ${platform} - ${url} - ${format}`);

    // Download the media
    const result = await downloadMedia(url, platform, format, converterId);

    if (!result.success || !result.stream) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Download failed' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Save to database
    const dbResult = addDownload({
      platform,
      url,
      title: result.title || 'Untitled',
      format,
      file_size: result.fileSize || 0,
      status: 'completed',
    });

    // Update stats
    updateStats(platform, format);

    console.log(`Download successful: ${result.filename}`);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (result.filename?.endsWith('.mp4')) {
      contentType = 'video/mp4';
    } else if (result.filename?.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (result.filename?.endsWith('.webm')) {
      contentType = 'video/webm';
    } else if (result.filename?.endsWith('.gif')) {
      contentType = 'image/gif';
    }

    // Stream the file as download
    const stream = result.stream as Readable;
    const nodeStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(nodeStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Download failed. Please try again.' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
