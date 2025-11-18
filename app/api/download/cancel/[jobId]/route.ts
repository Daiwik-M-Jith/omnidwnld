import { NextRequest, NextResponse } from 'next/server';
import { cancelJob } from '@/lib/downloaders';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    const cancelled = cancelJob(jobId);
    
    if (cancelled) {
      return NextResponse.json({ success: true, message: 'Job cancelled' });
    } else {
      return NextResponse.json({ success: false, error: 'Job not found or already completed' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Cancel job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
