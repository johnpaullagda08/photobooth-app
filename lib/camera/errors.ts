/**
 * Camera Error Handling Utility
 *
 * Provides user-friendly error messages and error categorization
 * for various camera-related issues.
 */

export type CameraErrorType =
  | 'permission_denied'
  | 'not_found'
  | 'in_use'
  | 'not_readable'
  | 'overconstrained'
  | 'disconnected'
  | 'dslr_not_detected'
  | 'dslr_capture_failed'
  | 'gphoto_not_installed'
  | 'unknown';

export interface CameraError {
  type: CameraErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  suggestion?: string;
}

/**
 * Parse a camera error and return a structured error object
 */
export function parseCameraError(error: unknown): CameraError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : '';

  // Permission denied
  if (
    errorName === 'NotAllowedError' ||
    errorName === 'PermissionDeniedError' ||
    errorMessage.includes('Permission denied') ||
    errorMessage.includes('not allowed')
  ) {
    return {
      type: 'permission_denied',
      message: errorMessage,
      userMessage: 'Camera access was denied.',
      recoverable: true,
      suggestion: 'Please allow camera access in your browser settings and refresh the page.',
    };
  }

  // Camera not found
  if (
    errorName === 'NotFoundError' ||
    errorName === 'DevicesNotFoundError' ||
    errorMessage.includes('Requested device not found') ||
    errorMessage.includes('no video input devices')
  ) {
    return {
      type: 'not_found',
      message: errorMessage,
      userMessage: 'No camera was found.',
      recoverable: true,
      suggestion: 'Please connect a camera and click "Refresh" to try again.',
    };
  }

  // Camera in use by another application
  if (
    errorName === 'NotReadableError' ||
    errorName === 'TrackStartError' ||
    errorMessage.includes('Could not start video source') ||
    errorMessage.includes('hardware error')
  ) {
    return {
      type: 'in_use',
      message: errorMessage,
      userMessage: 'The camera is being used by another application.',
      recoverable: true,
      suggestion: 'Please close other apps that might be using the camera (Zoom, Skype, etc.) and try again.',
    };
  }

  // Overconstrained (requested constraints not satisfiable)
  if (
    errorName === 'OverconstrainedError' ||
    errorMessage.includes('Constraints could not be satisfied')
  ) {
    return {
      type: 'overconstrained',
      message: errorMessage,
      userMessage: 'The camera does not support the requested settings.',
      recoverable: true,
      suggestion: 'Try selecting a different camera or refreshing the page.',
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: 'An unexpected camera error occurred.',
    recoverable: true,
    suggestion: 'Please try refreshing the page or reconnecting your camera.',
  };
}

/**
 * Create a DSLR-specific error
 */
export function createDSLRError(type: 'not_detected' | 'capture_failed' | 'gphoto_missing', details?: string): CameraError {
  switch (type) {
    case 'not_detected':
      return {
        type: 'dslr_not_detected',
        message: details || 'No DSLR camera detected',
        userMessage: 'No DSLR camera was detected.',
        recoverable: true,
        suggestion: 'Please ensure your DSLR is connected via USB, powered on, and not being used by other software.',
      };
    case 'capture_failed':
      return {
        type: 'dslr_capture_failed',
        message: details || 'DSLR capture failed',
        userMessage: 'Failed to capture photo from DSLR.',
        recoverable: true,
        suggestion: 'Please check that your camera is ready and try again. Make sure the lens cap is off and the camera is focused.',
      };
    case 'gphoto_missing':
      return {
        type: 'gphoto_not_installed',
        message: details || 'gPhoto2 not installed',
        userMessage: 'gPhoto2 is not installed on the server.',
        recoverable: false,
        suggestion: 'USB tethering requires gPhoto2. Please install it or use HDMI capture instead.',
      };
  }
}

/**
 * Get a user-friendly error message for display
 */
export function getUserFriendlyErrorMessage(error: CameraError): string {
  if (error.suggestion) {
    return `${error.userMessage} ${error.suggestion}`;
  }
  return error.userMessage;
}

/**
 * Check if a camera error is likely due to the device being disconnected
 */
export function isDisconnectionError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : '';

  return (
    errorName === 'NotReadableError' ||
    errorMessage.includes('device disconnected') ||
    errorMessage.includes('no longer available') ||
    errorMessage.includes('Failed to allocate')
  );
}

/**
 * Common camera permission check
 */
export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  try {
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
  } catch {
    // Permissions API not supported
  }
  return 'unknown';
}

/**
 * Request camera permission by briefly accessing a stream
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}
