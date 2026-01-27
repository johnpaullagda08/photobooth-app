import { NextRequest, NextResponse } from 'next/server';
import { captureImage, isGPhoto2Available } from '@/lib/camera/gphoto';

export async function POST(request: NextRequest) {
  try {
    // Check if gPhoto2 is available
    const available = await isGPhoto2Available();

    if (!available) {
      return NextResponse.json({
        success: false,
        error: 'gPhoto2 is not installed',
      });
    }

    // Parse request body
    const body = await request.json();
    const { port } = body;

    // Capture image
    const result = await captureImage(port);

    if (result.success) {
      return NextResponse.json({
        success: true,
        imageData: result.imageData,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Capture failed',
      });
    }
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Capture failed',
      },
      { status: 500 }
    );
  }
}
