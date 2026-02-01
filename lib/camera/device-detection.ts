/**
 * Camera Device Detection Utility
 *
 * Detects and categorizes camera devices by type based on device labels.
 * Helps users identify DSLR and mirrorless cameras connected via HDMI capture cards or USB.
 */

export type CameraDeviceType = 'webcam' | 'hdmi-capture' | 'mirrorless' | 'virtual' | 'unknown';

export interface DetectedCameraDevice {
  deviceId: string;
  label: string;
  groupId: string;
  type: CameraDeviceType;
  brand?: string;
  /** Device is likely a DSLR (via HDMI capture) or mirrorless camera */
  isLikelyProfessional: boolean;
  /** @deprecated Use isLikelyProfessional instead */
  isLikelyDSLR: boolean;
}

// Known HDMI capture card manufacturers and product patterns
const HDMI_CAPTURE_PATTERNS = [
  // Elgato
  { pattern: /elgato/i, brand: 'Elgato' },
  { pattern: /cam\s*link/i, brand: 'Elgato' },
  { pattern: /hd60/i, brand: 'Elgato' },
  { pattern: /4k60/i, brand: 'Elgato' },

  // AVerMedia
  { pattern: /avermedia/i, brand: 'AVerMedia' },
  { pattern: /live\s*gamer/i, brand: 'AVerMedia' },
  { pattern: /gc\d{3}/i, brand: 'AVerMedia' },

  // Blackmagic Design
  { pattern: /blackmagic/i, brand: 'Blackmagic' },
  { pattern: /decklink/i, brand: 'Blackmagic' },
  { pattern: /ultrastudio/i, brand: 'Blackmagic' },
  { pattern: /intensity/i, brand: 'Blackmagic' },
  { pattern: /atem/i, brand: 'Blackmagic' },

  // Magewell
  { pattern: /magewell/i, brand: 'Magewell' },
  { pattern: /usb\s*capture/i, brand: 'Magewell' },
  { pattern: /pro\s*capture/i, brand: 'Magewell' },

  // Generic HDMI capture keywords
  { pattern: /hdmi\s*(capture|input|video)/i, brand: 'Generic' },
  { pattern: /video\s*capture/i, brand: 'Generic' },
  { pattern: /capture\s*card/i, brand: 'Generic' },
  { pattern: /game\s*capture/i, brand: 'Generic' },
  { pattern: /usb\s*video/i, brand: 'Generic' },
  { pattern: /uvc\s*camera/i, brand: 'Generic' },

  // Chinese capture cards often use generic names
  { pattern: /hd\s*video\s*capture/i, brand: 'Generic' },
  { pattern: /usb3?\s*hdmi/i, brand: 'Generic' },

  // Atomos
  { pattern: /atomos/i, brand: 'Atomos' },

  // Razer Ripsaw
  { pattern: /razer/i, brand: 'Razer' },
  { pattern: /ripsaw/i, brand: 'Razer' },

  // EVGA
  { pattern: /evga/i, brand: 'EVGA' },
  { pattern: /xr1/i, brand: 'EVGA' },
];

// Known mirrorless camera patterns (USB webcam/UVC mode)
const MIRRORLESS_CAMERA_PATTERNS = [
  // Sony (Alpha, ZV series)
  { pattern: /sony.*(?:a7|a9|a1|a6|zv|ilce|alpha)/i, brand: 'Sony' },
  { pattern: /sony.*camera/i, brand: 'Sony' },
  { pattern: /ilce-?\d/i, brand: 'Sony' },
  { pattern: /zv-?e?\d/i, brand: 'Sony' },
  { pattern: /sony.*uvc/i, brand: 'Sony' },

  // Canon (EOS R series, M series)
  { pattern: /canon.*(?:eos|r\d|rp|r5|r6|r7|r8|r10|r50|m\d)/i, brand: 'Canon' },
  { pattern: /canon.*camera/i, brand: 'Canon' },
  { pattern: /eos.*webcam/i, brand: 'Canon' },

  // Nikon (Z series)
  { pattern: /nikon.*(?:z\d|z\s*\d|z\s*fc)/i, brand: 'Nikon' },
  { pattern: /nikon.*camera/i, brand: 'Nikon' },

  // Fujifilm (X series, GFX)
  { pattern: /fuji(?:film)?.*(?:x-?[a-z]?\d|gfx)/i, brand: 'Fujifilm' },
  { pattern: /fuji(?:film)?.*camera/i, brand: 'Fujifilm' },
  { pattern: /x-?(?:t\d|s\d|h\d|e\d|pro\d|a\d)/i, brand: 'Fujifilm' },

  // Panasonic (Lumix S, G series)
  { pattern: /panasonic.*(?:lumix|dc-|gh\d|s\d|g\d)/i, brand: 'Panasonic' },
  { pattern: /lumix.*(?:s\d|gh\d|g\d)/i, brand: 'Panasonic' },
  { pattern: /panasonic.*camera/i, brand: 'Panasonic' },

  // Olympus/OM System
  { pattern: /olympus.*(?:om-?d|e-?m\d|pen)/i, brand: 'Olympus' },
  { pattern: /om\s*system/i, brand: 'OM System' },
  { pattern: /om-?\d/i, brand: 'OM System' },

  // Leica
  { pattern: /leica.*(?:sl|q|cl|m\d|typ)/i, brand: 'Leica' },
  { pattern: /leica.*camera/i, brand: 'Leica' },

  // Sigma (fp series)
  { pattern: /sigma.*(?:fp|sd)/i, brand: 'Sigma' },

  // Hasselblad
  { pattern: /hasselblad/i, brand: 'Hasselblad' },

  // Generic mirrorless/digital camera indicators
  { pattern: /digital\s*camera/i, brand: 'Generic' },
  { pattern: /mirrorless/i, brand: 'Generic' },
  { pattern: /interchangeable\s*lens/i, brand: 'Generic' },
];

// Known virtual/software camera patterns
const VIRTUAL_CAMERA_PATTERNS = [
  /obs\s*virtual/i,
  /snap\s*camera/i,
  /virtual\s*camera/i,
  /manycam/i,
  /xsplit/i,
  /streamlabs/i,
  /mmhmm/i,
  /camo/i, // Reincubate Camo
  /ivcam/i,
  /droidcam/i,
  /epoccam/i,
  /ndi/i,
];

// Known webcam manufacturer patterns
const WEBCAM_PATTERNS = [
  { pattern: /logitech/i, brand: 'Logitech' },
  { pattern: /c920/i, brand: 'Logitech' },
  { pattern: /c922/i, brand: 'Logitech' },
  { pattern: /brio/i, brand: 'Logitech' },
  { pattern: /streamcam/i, brand: 'Logitech' },
  { pattern: /microsoft/i, brand: 'Microsoft' },
  { pattern: /lifecam/i, brand: 'Microsoft' },
  { pattern: /razer\s*kiyo/i, brand: 'Razer' },
  { pattern: /kiyo/i, brand: 'Razer' },
  { pattern: /creative/i, brand: 'Creative' },
  { pattern: /facetime/i, brand: 'Apple' },
  { pattern: /isight/i, brand: 'Apple' },
  { pattern: /integrated.*camera/i, brand: 'Built-in' },
  { pattern: /built-?in/i, brand: 'Built-in' },
  { pattern: /front\s*camera/i, brand: 'Built-in' },
  { pattern: /rear\s*camera/i, brand: 'Built-in' },
  { pattern: /webcam/i, brand: 'Generic Webcam' },
];

/**
 * Detect the type of camera device based on its label
 */
export function detectDeviceType(label: string): { type: CameraDeviceType; brand?: string } {
  const normalizedLabel = label.toLowerCase().trim();

  // Check for virtual cameras first (lowest priority, should be filtered out)
  for (const pattern of VIRTUAL_CAMERA_PATTERNS) {
    if (pattern.test(normalizedLabel)) {
      return { type: 'virtual' };
    }
  }

  // Check for mirrorless cameras (USB webcam mode) - high priority
  for (const { pattern, brand } of MIRRORLESS_CAMERA_PATTERNS) {
    if (pattern.test(normalizedLabel)) {
      return { type: 'mirrorless', brand };
    }
  }

  // Check for HDMI capture cards (likely connected to DSLR/mirrorless)
  for (const { pattern, brand } of HDMI_CAPTURE_PATTERNS) {
    if (pattern.test(normalizedLabel)) {
      return { type: 'hdmi-capture', brand };
    }
  }

  // Check for known webcams
  for (const { pattern, brand } of WEBCAM_PATTERNS) {
    if (pattern.test(normalizedLabel)) {
      return { type: 'webcam', brand };
    }
  }

  // Default to unknown if no patterns match
  // Could be a DSLR connected directly or an unrecognized device
  return { type: 'unknown' };
}

/**
 * Enhanced device detection with full device info
 */
export function detectCameraDevice(device: MediaDeviceInfo): DetectedCameraDevice {
  const label = device.label || `Camera ${device.deviceId.slice(0, 8)}`;
  const { type, brand } = detectDeviceType(label);

  // HDMI capture cards and mirrorless cameras are professional-grade
  const isLikelyProfessional = type === 'hdmi-capture' || type === 'mirrorless';

  return {
    deviceId: device.deviceId,
    label,
    groupId: device.groupId,
    type,
    brand,
    isLikelyProfessional,
    // Backwards compatibility - HDMI capture cards are likely connected to DSLRs
    isLikelyDSLR: type === 'hdmi-capture',
  };
}

/**
 * Get all camera devices with type detection
 */
export async function getDetectedCameraDevices(): Promise<DetectedCameraDevice[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');

    return videoDevices.map(detectCameraDevice);
  } catch (error) {
    console.error('Failed to enumerate camera devices:', error);
    return [];
  }
}

/**
 * Get a user-friendly type label
 */
export function getDeviceTypeLabel(type: CameraDeviceType): string {
  switch (type) {
    case 'mirrorless':
      return 'Mirrorless';
    case 'hdmi-capture':
      return 'HDMI Capture';
    case 'webcam':
      return 'Webcam';
    case 'virtual':
      return 'Virtual';
    case 'unknown':
    default:
      return 'Camera';
  }
}

/**
 * Get device type icon name for UI
 */
export function getDeviceTypeIcon(type: CameraDeviceType): string {
  switch (type) {
    case 'mirrorless':
      return 'camera'; // Professional camera icon
    case 'hdmi-capture':
      return 'monitor'; // HDMI/Monitor icon
    case 'webcam':
      return 'video'; // Video/Webcam icon
    case 'virtual':
      return 'app-window'; // Software/App icon
    case 'unknown':
    default:
      return 'camera'; // Generic camera icon
  }
}

/**
 * Sort devices by priority (professional cameras first, then webcams)
 */
export function sortDevicesByPriority(devices: DetectedCameraDevice[]): DetectedCameraDevice[] {
  return [...devices].sort((a, b) => {
    const priority: Record<CameraDeviceType, number> = {
      'mirrorless': 0,   // Highest priority (professional USB camera)
      'hdmi-capture': 1, // High priority (likely DSLR via capture card)
      'webcam': 2,
      'unknown': 3,
      'virtual': 4,      // Lowest priority
    };
    return priority[a.type] - priority[b.type];
  });
}

/**
 * Check if a device is suitable for photobooth use
 */
export function isDeviceSuitableForPhotobooth(device: DetectedCameraDevice): boolean {
  // Virtual cameras are not suitable for photobooths
  return device.type !== 'virtual';
}

/**
 * Check if a device is a professional camera (mirrorless or DSLR via capture card)
 */
export function isProfessionalCamera(device: DetectedCameraDevice): boolean {
  return device.type === 'mirrorless' || device.type === 'hdmi-capture';
}

/**
 * Get the professional camera badge text
 */
export function getProfessionalCameraBadge(type: CameraDeviceType): string | null {
  switch (type) {
    case 'mirrorless':
      return 'Mirrorless';
    case 'hdmi-capture':
      return 'DSLR';
    default:
      return null;
  }
}
