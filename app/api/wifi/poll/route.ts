import { NextRequest, NextResponse } from 'next/server';
import { pollForNewImages } from '@/lib/camera/wifi-poll';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderPath, since = 0 } = body;

    if (!folderPath) {
      return NextResponse.json({
        success: false,
        error: 'folderPath is required',
      });
    }

    // Poll for new images
    const images = await pollForNewImages(folderPath, since);

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Poll failed',
      },
      { status: 500 }
    );
  }
}
