# Camera System Documentation

## Overview

The photobooth supports multiple camera input sources, from basic webcams to professional mirrorless cameras. The camera system is designed to be flexible and automatically detect camera types.

## Camera Sources

### 1. Webcam (Browser MediaDevices)

**Use Case**: Built-in laptop cameras, USB webcams

**Implementation**:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: selectedDeviceId,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: 'user'
  }
});
```

**Supported Devices**:
- Built-in laptop cameras
- Logitech webcams (C920, C922, BRIO, etc.)
- Microsoft LifeCam
- Razer Kiyo
- Creative webcams

### 2. HDMI Capture (Browser MediaDevices)

**Use Case**: DSLR/mirrorless cameras via HDMI out to capture card

**Implementation**: Same as webcam - capture cards appear as video input devices

**Supported Capture Cards**:
- Elgato Cam Link 4K
- Elgato HD60 S/S+
- AVerMedia Live Gamer series
- Blackmagic Design (DeckLink, UltraStudio)
- Magewell USB Capture
- Atomos Connect
- Razer Ripsaw

**Detection Pattern**:
```typescript
const HDMI_CAPTURE_PATTERNS = [
  'Elgato', 'Cam Link', 'HD60',
  'AVerMedia', 'Live Gamer',
  'Blackmagic', 'DeckLink',
  'Magewell', 'USB Capture',
  'Atomos',
  'Razer Ripsaw'
];
```

### 3. USB Tether (gPhoto2 - Server Required)

**Use Case**: Direct USB connection to DSLR for high-quality captures

**Requirements**:
- Local Node.js server
- gPhoto2 installed on system
- Camera in PTP/MTP mode

**Implementation**:
```typescript
// API endpoint triggers gPhoto2
const response = await fetch('/api/camera/capture', {
  method: 'POST'
});
const { imageData } = await response.json();
```

**Supported Cameras** (via gPhoto2):
- Canon EOS series (5D, 6D, R, RP, etc.)
- Nikon D series, Z series
- Sony Alpha series
- Fujifilm X series
- Many others (see gPhoto2 compatibility)

### 4. WiFi Transfer (Server Required)

**Use Case**: Cameras with WiFi transfer to watched folder

**Requirements**:
- Local Node.js server
- Shared folder accessible to server
- Camera configured to transfer images

**Implementation**:
```typescript
// Poll endpoint for new images
const response = await fetch('/api/wifi/poll', {
  method: 'POST',
  body: JSON.stringify({
    folderPath: '/path/to/wifi-folder',
    pollInterval: 2000
  })
});
```

## Device Detection

### Camera Type Detection

The system automatically categorizes cameras based on their label:

```typescript
function detectCameraType(label: string): CameraDeviceType {
  const normalizedLabel = label.toLowerCase();

  // Check for virtual cameras
  if (VIRTUAL_CAMERA_PATTERNS.some(p => normalizedLabel.includes(p))) {
    return 'virtual';
  }

  // Check for HDMI capture devices
  if (HDMI_CAPTURE_PATTERNS.some(p => normalizedLabel.includes(p))) {
    return 'hdmi-capture';
  }

  // Check for mirrorless cameras
  if (MIRRORLESS_PATTERNS.some(p => normalizedLabel.includes(p))) {
    return 'mirrorless';
  }

  // Check for standard webcams
  if (WEBCAM_PATTERNS.some(p => normalizedLabel.includes(p))) {
    return 'webcam';
  }

  return 'unknown';
}
```

### Brand Detection

```typescript
const MIRRORLESS_PATTERNS = {
  'sony': ['sony', 'alpha', 'zv-'],
  'canon': ['canon', 'eos r', 'eos m'],
  'nikon': ['nikon', 'z 5', 'z 6', 'z 7', 'z 8', 'z 9'],
  'fujifilm': ['fuji', 'x-t', 'x-s', 'x-h', 'x-pro'],
  'panasonic': ['panasonic', 'lumix', 'gh', 's1', 's5'],
  'olympus': ['olympus', 'om-d', 'pen'],
  'leica': ['leica', 'sl2'],
  'sigma': ['sigma', 'fp']
};
```

## Camera Context

### Provider Setup

```tsx
// app/booth/page.tsx
import { CameraProvider } from '@/components/camera/CameraProvider';

export default function BoothPage() {
  return (
    <CameraProvider>
      <BoothContent />
    </CameraProvider>
  );
}
```

### Using Camera Context

```tsx
import { useCameraContext } from '@/components/camera/CameraProvider';

function CaptureComponent() {
  const {
    stream,
    devices,
    activeDevice,
    source,
    isMirrored,
    isLoading,
    error,
    setDevice,
    setSource,
    toggleMirror,
    capture
  } = useCameraContext();

  const handleCapture = async () => {
    const dataUrl = await capture();
    // Use captured image
  };

  return (
    <div>
      <CameraPreview stream={stream} mirrored={isMirrored} />
      <button onClick={handleCapture}>Capture</button>
    </div>
  );
}
```

## Capture Flow

### Standard Capture (Webcam/HDMI)

```
1. User triggers capture
2. Countdown displayed (if enabled)
3. Canvas captures video frame
4. Apply filter (if selected)
5. Convert to data URL
6. Store in photo array
7. Proceed to next photo or result
```

### USB Tether Capture

```
1. User triggers capture
2. Countdown displayed
3. API call to /api/camera/capture
4. gPhoto2 triggers camera shutter
5. Image downloaded from camera
6. Convert to data URL
7. Return to client
```

### WiFi Transfer Capture

```
1. User triggers capture
2. Countdown displayed
3. User manually takes photo on camera
4. Camera transfers to watched folder
5. Server detects new file
6. Server returns image data
7. Client receives photo
```

## Video Constraints

### Default Constraints

```typescript
const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920, min: 1280 },
  height: { ideal: 1080, min: 720 },
  frameRate: { ideal: 30, min: 24 },
  facingMode: 'user'
};
```

### High Quality Constraints

```typescript
const HIGH_QUALITY_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 3840 },  // 4K
  height: { ideal: 2160 },
  frameRate: { ideal: 30 }
};
```

## Network Access

### Secure Context Requirements

Camera access requires a secure context:

| URL Pattern | Camera Access |
|-------------|---------------|
| `https://domain.com` | Yes |
| `http://localhost` | Yes |
| `http://127.0.0.1` | Yes |
| `http://192.168.x.x` | **No** |

### Solutions for Network Access

1. **Use HTTPS** with valid certificate
2. **Use ngrok** or similar tunneling service
3. **Use localhost** on the device with camera

## Error Handling

### Common Errors

```typescript
enum CameraError {
  NOT_FOUND = 'NotFoundError',           // No camera found
  NOT_ALLOWED = 'NotAllowedError',       // Permission denied
  NOT_READABLE = 'NotReadableError',     // Camera in use
  OVERCONSTRAINED = 'OverconstrainedError', // Constraints not supported
  ABORT = 'AbortError',                  // Request aborted
  SECURITY = 'SecurityError'             // Insecure context
}
```

### Error Messages

```typescript
const ERROR_MESSAGES = {
  [CameraError.NOT_FOUND]: 'No camera found. Please connect a camera.',
  [CameraError.NOT_ALLOWED]: 'Camera access denied. Please allow camera permissions.',
  [CameraError.NOT_READABLE]: 'Camera is in use by another application.',
  [CameraError.OVERCONSTRAINED]: 'Camera does not support requested settings.',
  [CameraError.SECURITY]: 'Camera requires a secure connection (HTTPS).'
};
```

## Performance Tips

### Reduce CPU Usage

```typescript
// Lower resolution for preview
const previewConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 24 }
};

// Full resolution only for capture
const captureConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 }
};
```

### Canvas Optimization

```typescript
// Use OffscreenCanvas for capture
const offscreen = new OffscreenCanvas(width, height);
const ctx = offscreen.getContext('2d');
ctx.drawImage(video, 0, 0);
const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
```

## Troubleshooting

### Camera Not Detected

1. Check USB connection
2. Verify camera is on and in correct mode
3. Check browser permissions
4. Try different USB port
5. Restart browser

### Poor Image Quality

1. Clean camera lens
2. Improve lighting
3. Adjust camera settings
4. Use higher resolution constraints
5. Check capture card settings

### Lag/Delay

1. Reduce resolution
2. Lower frame rate
3. Close other applications
4. Use wired connection (for WiFi cameras)
5. Check USB bandwidth (for USB 2.0 vs 3.0)
