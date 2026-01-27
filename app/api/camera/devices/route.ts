import { NextResponse } from 'next/server';
import { detectCameras, isGPhoto2Available } from '@/lib/camera/gphoto';

export async function GET() {
  try {
    // Check if gPhoto2 is available
    const available = await isGPhoto2Available();

    if (!available) {
      return NextResponse.json({
        success: false,
        error: 'gPhoto2 is not installed. Please install it to use USB tethering.',
        cameras: [],
      });
    }

    // Detect connected cameras
    const cameras = await detectCameras();

    return NextResponse.json({
      success: true,
      cameras,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to detect cameras',
        cameras: [],
      },
      { status: 500 }
    );
  }
}
