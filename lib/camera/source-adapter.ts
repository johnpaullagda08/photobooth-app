import type { CameraSource, CapturedPhoto, TetherCaptureResult, WiFiImageResult } from '@/types';

/**
 * Unified interface for capturing photos from different sources
 */
export interface CameraAdapter {
  source: CameraSource;
  isAvailable(): Promise<boolean>;
  capture(): Promise<CapturedPhoto | null>;
}

/**
 * Create a captured photo object from raw image data
 */
export function createCapturedPhoto(
  imageData: string,
  filterId: string = 'none'
): CapturedPhoto {
  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dataUrl: imageData,
    timestamp: Date.now(),
    filterId,
  };
}

/**
 * Convert TetherCaptureResult to CapturedPhoto
 */
export function fromTetherResult(result: TetherCaptureResult): CapturedPhoto | null {
  if (!result.success || !result.imageData) {
    return null;
  }
  return createCapturedPhoto(result.imageData);
}

/**
 * Convert WiFiImageResult to CapturedPhoto
 */
export function fromWiFiResult(result: WiFiImageResult): CapturedPhoto {
  return createCapturedPhoto(result.imageData);
}

/**
 * Get display name for camera source
 */
export function getSourceDisplayName(source: CameraSource): string {
  switch (source) {
    case 'webcam':
      return 'Webcam';
    case 'hdmi':
      return 'HDMI Capture';
    case 'usb-tether':
      return 'USB Tethered Camera';
    case 'wifi':
      return 'WiFi Transfer';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a camera source requires server-side support
 */
export function requiresServer(source: CameraSource): boolean {
  return source === 'usb-tether' || source === 'wifi';
}

/**
 * Get instructions for setting up a camera source
 */
export function getSetupInstructions(source: CameraSource): string[] {
  switch (source) {
    case 'webcam':
      return [
        'Allow camera access when prompted',
        'Select your preferred camera from the dropdown',
        'Adjust mirror setting if needed',
      ];
    case 'hdmi':
      return [
        'Connect HDMI capture card to your computer',
        'Connect your camera to the capture card',
        'Select the capture card from the camera list',
        'Ensure camera is set to video output mode',
      ];
    case 'usb-tether':
      return [
        'Install gPhoto2 on the server (brew install gphoto2)',
        'Connect your DSLR camera via USB',
        'Set camera to PC Connect or Tethering mode',
        'Close any other applications using the camera',
        'Click Refresh to detect the camera',
      ];
    case 'wifi':
      return [
        'Install your camera manufacturer WiFi app',
        'Configure the app to save images to a specific folder',
        'Enter that folder path in the settings above',
        'Click Start Polling to begin monitoring',
        'Take photos - they will appear automatically',
      ];
    default:
      return [];
  }
}
