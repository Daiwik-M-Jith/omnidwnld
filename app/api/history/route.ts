import { NextRequest, NextResponse } from 'next/server';
import { getRecentDownloads } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const downloads = getRecentDownloads(50);

    return NextResponse.json({
      success: true,
      downloads,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
