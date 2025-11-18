import { NextRequest, NextResponse } from 'next/server';
import { getTotalDownloads, getTopPlatforms } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const totalDownloads = getTotalDownloads();
    const topPlatforms = getTopPlatforms(10);

    return NextResponse.json({
      success: true,
      stats: {
        totalDownloads,
        topPlatforms,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
