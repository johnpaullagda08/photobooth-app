/**
 * Camera Utilities
 *
 * Re-exports all camera-related utilities for easy importing.
 */

// Device detection and categorization
export {
  detectDeviceType,
  detectCameraDevice,
  getDetectedCameraDevices,
  getDeviceTypeLabel,
  getDeviceTypeIcon,
  sortDevicesByPriority,
  isDeviceSuitableForPhotobooth,
  isProfessionalCamera,
  getProfessionalCameraBadge,
  type CameraDeviceType,
  type DetectedCameraDevice,
} from './device-detection';

// Error handling
export {
  parseCameraError,
  createDSLRError,
  getUserFriendlyErrorMessage,
  isDisconnectionError,
  checkCameraPermission,
  requestCameraPermission,
  type CameraErrorType,
  type CameraError,
} from './errors';
