import { NextRequest, NextResponse } from 'next/server';
import { getCameraInfo, getCameraConfig, isGPhoto2Available } from '@/lib/camera/gphoto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const port = searchParams.get('port') || undefined;

    // Check if gPhoto2 is available
    const available = await isGPhoto2Available();

    if (!available) {
      return NextResponse.json({
        success: false,
        error: 'gPhoto2 is not installed',
      });
    }

    // Get camera info
    const info = await getCameraInfo(port);
    const config = await getCameraConfig(port);

    return NextResponse.json({
      success: true,
      info,
      config,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to get camera info',
      },
      { status: 500 }
    );
  }
}
