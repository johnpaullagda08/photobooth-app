/**
 * Camera Error Handling Utility
 *
 * Provides user-friendly error messages and error categorization
 * for various camera-related issues. Supports multi-device access
 * including remote devices on the same network.
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
  | 'insecure_context'
  | 'api_not_available'
  | 'unknown';

export interface CameraError {
  type: CameraErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  suggestion?: string;
}

/**
 * Check if the current context is secure (required for camera access)
 * Camera access requires: HTTPS, localhost, or file:// protocol
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;

  // Use the browser's built-in check if available
  if ('isSecureContext' in window) {
    return (window as Window).isSecureContext;
  }

  // Fallback check for older browsers
  const protocol = (window as Window).location.protocol;
  const hostname = (window as Window).location.hostname;

  return (
    protocol === 'https:' ||
    protocol === 'file:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost')
  );
}

/**
 * Check if MediaDevices API is available in the current environment
 */
export function isMediaDevicesAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Get information about why camera access might not work
 */
export interface CameraAccessStatus {
  available: boolean;
  reason?: 'insecure_context' | 'api_not_available' | 'server_side';
  message: string;
  suggestion?: string;
}

/**
 * Check if camera access is possible in the current environment
 * Returns detailed status about availability
 */
export function checkCameraAccessAvailability(): CameraAccessStatus {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return {
      available: false,
      reason: 'server_side',
      message: 'Camera access is not available during server-side rendering.',
    };
  }

  // Check for secure context first
  if (!isSecureContext()) {
    const currentUrl = (window as Window).location.href;
    const isLocalNetwork = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(currentUrl);

    return {
      available: false,
      reason: 'insecure_context',
      message: 'Camera access requires a secure connection (HTTPS).',
      suggestion: isLocalNetwork
        ? 'You are accessing this app over a local network IP. To use the camera, either:\n• Enable HTTPS on your server with a valid certificate\n• Use a tunneling service like ngrok to get an HTTPS URL\n• Access the app from the server machine directly (localhost)'
        : 'Please access this app via HTTPS to enable camera features.',
    };
  }

  // Check if MediaDevices API is available
  if (!isMediaDevicesAvailable()) {
    return {
      available: false,
      reason: 'api_not_available',
      message: 'Camera API is not available in this browser.',
      suggestion: 'Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
    };
  }

  return {
    available: true,
    message: 'Camera access is available.',
  };
}

/**
 * Parse a camera error and return a structured error object
 */
export function parseCameraError(error: unknown): CameraError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : '';

  // Check for insecure context errors
  if (
    errorMessage.includes('secure context') ||
    errorMessage.includes('HTTPS') ||
    errorName === 'SecurityError'
  ) {
    return {
      type: 'insecure_context',
      message: errorMessage,
      userMessage: 'Camera access requires a secure connection (HTTPS).',
      recoverable: false,
      suggestion: 'Please access this app via HTTPS or localhost to enable camera features.',
    };
  }

  // Check for API not available
  if (
    errorMessage.includes('mediaDevices') ||
    errorMessage.includes('getUserMedia') ||
    errorMessage.includes('not defined') ||
    errorMessage.includes('not a function')
  ) {
    return {
      type: 'api_not_available',
      message: errorMessage,
      userMessage: 'Camera API is not available.',
      recoverable: false,
      suggestion: 'Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
    };
  }

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
 * Handles various environments including insecure contexts and missing APIs
 */
export async function requestCameraPermission(): Promise<{
  granted: boolean;
  error?: CameraError;
}> {
  // Check if camera access is possible first
  const accessStatus = checkCameraAccessAvailability();
  if (!accessStatus.available) {
    return {
      granted: false,
      error: {
        type: accessStatus.reason === 'insecure_context' ? 'insecure_context' : 'api_not_available',
        message: accessStatus.message,
        userMessage: accessStatus.message,
        recoverable: false,
        suggestion: accessStatus.suggestion,
      },
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: parseCameraError(error),
    };
  }
}

/**
 * Legacy version of requestCameraPermission that returns a simple boolean
 * @deprecated Use requestCameraPermission() which returns detailed error info
 */
export async function requestCameraPermissionSimple(): Promise<boolean> {
  const result = await requestCameraPermission();
  return result.granted;
}

/**
 * Get a helpful message for users accessing over local network without HTTPS
 */
export function getNetworkAccessHelp(): string {
  return `
To use cameras on devices connected to the same network:

1. **Enable HTTPS** (Recommended)
   - Generate a self-signed certificate for your local server
   - Configure your server to use HTTPS
   - Devices can then access via https://192.168.x.x:3001

2. **Use a tunneling service**
   - Services like ngrok provide secure HTTPS URLs
   - Run: npx ngrok http 3001
   - Share the generated HTTPS URL with other devices

3. **Use localhost on the server**
   - Camera access works on localhost without HTTPS
   - Connect your camera to the server machine directly

Note: iPad, tablets, and mobile browsers require HTTPS for camera access
when not on localhost. This is a browser security requirement.
`.trim();
}
