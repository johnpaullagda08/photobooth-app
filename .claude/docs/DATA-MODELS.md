# Data Models Reference

## Core Types

### PhotoboothEvent

The main event configuration object:

```typescript
interface PhotoboothEvent {
  // Identification
  id: string;                       // UUID
  name: string;                     // Event name
  date: string;                     // ISO date string
  createdAt: number;                // Unix timestamp
  updatedAt: number;                // Unix timestamp

  // Base configuration
  paperSize: PaperSize;             // 'strip' | '4r'
  template: EventTemplate;          // 'wedding' | 'birthday' | 'corporate' | 'custom'

  // Feature configurations
  launchPage: LaunchPageConfig;     // Welcome screen
  camera: CameraConfig;             // Camera settings
  countdown: CountdownConfig;       // Timer settings
  printLayout: PrintLayoutConfig;   // Photo layout
  printing: PrintingConfig;         // Print output
  printer: PrinterConfig;           // Printer connection
}
```

### PaperSize

```typescript
type PaperSize = 'strip' | '4r';

// strip = 2" x 6" (600 x 1800 px at 300 DPI)
// 4r = 4" x 6" (1200 x 1800 px at 300 DPI)
```

## Configuration Objects

### LaunchPageConfig

Welcome screen customization:

```typescript
interface LaunchPageConfig {
  backgroundColor: string;          // Hex color (#000000)
  backgroundImage: string | null;   // Data URL
  backgroundOpacity: number;        // 0-100
  elements: DraggableElement[];     // UI elements
}

interface DraggableElement {
  id: string;
  type: ElementType;                // 'text' | 'logo' | 'image' | 'button' | 'shape'
  x: number;                        // 0-100 (percentage)
  y: number;                        // 0-100 (percentage)
  width: number;                    // 0-100 (percentage)
  height: number;                   // 0-100 (percentage)
  rotation: number;                 // Degrees
  visible: boolean;
  locked: boolean;
  zIndex: number;
  properties: ElementProperties;
}

type ElementType = 'text' | 'logo' | 'image' | 'button' | 'shape';

interface ElementProperties {
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';

  // Image properties
  src?: string;                     // Data URL
  objectFit?: 'cover' | 'contain' | 'fill';

  // Button properties
  label?: string;
  action?: 'start' | 'settings' | 'custom';

  // Shape properties
  shapeType?: 'rectangle' | 'circle' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}
```

### CameraConfig

```typescript
interface CameraConfig {
  deviceId: string | null;          // Selected device ID
  source: CameraSource;             // Input source
  isMirrored: boolean;              // Flip horizontally
}

type CameraSource = 'webcam' | 'hdmi' | 'usb-tether' | 'wifi';
```

### CountdownConfig

```typescript
interface CountdownConfig {
  enabled: boolean;
  duration: CountdownDuration;      // 3 | 5 | 8 | 10 seconds
  beforeCapture: boolean;           // Show before each photo
  beforePrint: boolean;             // Show before printing
  showAnimation: boolean;           // Animated numbers
  soundEnabled: boolean;            // Beep sounds
}

type CountdownDuration = 3 | 5 | 8 | 10;
```

### PrintLayoutConfig

```typescript
interface PrintLayoutConfig {
  format: PrintFormat;              // '2x6-strip' | '4x6-4r'
  orientation: Orientation;         // 'portrait' | 'landscape'
  photoCount: PhotoCount;           // 1 | 3 | 4
  layoutPreset: LayoutPreset;       // 'grid' | 'custom'
  margins: Margins;
  spacing: number;                  // Gap between photos (pixels)
  boxes: BoxConfig[];               // Photo positions
  frameTemplate: string | null;     // Frame overlay (data URL)
  backgroundImage: string | null;   // Background (data URL)
  backgroundColor: string;          // Background color (hex)
  overlays: OverlayConfig[];        // Additional overlays
}

type PrintFormat = '2x6-strip' | '4x6-4r';
type Orientation = 'portrait' | 'landscape';
type PhotoCount = 1 | 3 | 4;
type LayoutPreset = 'grid' | 'custom';

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BoxConfig {
  id: string;
  label: string;                    // "Photo 1", "Photo 2", etc.
  x: number;                        // 0-100 (percentage from left)
  y: number;                        // 0-100 (percentage from top)
  width: number;                    // 0-100 (percentage)
  height: number;                   // 0-100 (percentage)
}

interface OverlayConfig {
  id: string;
  type: OverlayType;                // 'frame' | 'watermark' | 'logo' | 'text'
  position: Position;
  opacity: number;                  // 0-100
  visible: boolean;
  src?: string;                     // For image overlays
  text?: string;                    // For text overlays
  style?: OverlayStyle;
}

type OverlayType = 'frame' | 'watermark' | 'logo' | 'text';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OverlayStyle {
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}
```

### PrintingConfig

```typescript
interface PrintingConfig {
  paperSize: PaperSize;
  printOutput: PrintOutput;         // 'download' | 'print' | 'both'
  copies: number;                   // 1-10
  autoPrint: boolean;               // Print automatically
  quality: PrintQuality;            // 'draft' | 'normal' | 'high'
  colorCorrection: ColorCorrection;
}

type PrintOutput = 'download' | 'print' | 'both';
type PrintQuality = 'draft' | 'normal' | 'high';

interface ColorCorrection {
  enabled: boolean;
  brightness: number;               // -100 to 100
  contrast: number;                 // -100 to 100
  saturation: number;               // -100 to 100
}
```

### PrinterConfig

```typescript
interface PrinterConfig {
  type: PrinterType;                // 'thermal' | 'inkjet' | 'browser'
  connectionType: ConnectionType;   // 'usb' | 'network' | 'browser'
  vendorId?: number;                // USB vendor ID
  productId?: number;               // USB product ID
  ipAddress?: string;               // Network printer IP
  port?: number;                    // Network printer port
}

type PrinterType = 'thermal' | 'inkjet' | 'browser';
type ConnectionType = 'usb' | 'network' | 'browser';
```

## Template Types

### LayoutTemplate

```typescript
interface LayoutTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  boxes: BoxConfig[];
  backgroundImage?: string | null;
  frameTemplate?: string | null;
  backgroundColor?: string;
  isBuiltIn?: boolean;              // System templates can't be deleted
}
```

### Built-in Templates

| Name | Paper Size | Photos | Layout |
|------|------------|--------|--------|
| 4-Photo Strip | strip | 4 | Vertical stack |
| 3-Photo Strip | strip | 3 | Vertical stack with spacing |
| Single Photo | strip | 1 | Centered large |
| 4R Grid | 4r | 4 | 2x2 grid |
| 4R Duo | 4r | 2 | Side by side |

## Camera Types

### DetectedCameraDevice

```typescript
interface DetectedCameraDevice {
  deviceId: string;
  label: string;
  type: CameraDeviceType;
  brand?: string;
  isLikelyProfessional: boolean;
}

type CameraDeviceType = 'webcam' | 'hdmi-capture' | 'mirrorless' | 'virtual' | 'unknown';
```

### Supported Brands

**Mirrorless Cameras (USB)**
- Sony (Alpha, ZV series)
- Canon (EOS R series)
- Nikon (Z series)
- Fujifilm (X series)
- Panasonic (Lumix)
- Olympus (OM-D)
- Leica
- Sigma (fp)

**HDMI Capture Cards**
- Elgato (Cam Link, HD60)
- AVerMedia
- Blackmagic
- Magewell
- Atomos
- Razer Ripsaw

## Capture Types

### CapturedPhoto

```typescript
interface CapturedPhoto {
  id: string;
  dataUrl: string;                  // Base64 image data
  timestamp: number;                // Unix timestamp
  filterId?: string;                // Applied filter
}
```

### Filter

```typescript
interface Filter {
  id: string;
  name: string;
  cssFilter: string;                // CSS filter string
  thumbnail?: string;               // Preview image
}
```

## Storage Schema

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  EVENTS: 'photobooth_events',                    // PhotoboothEvent[]
  ACTIVE_EVENT: 'photobooth_active_event',        // string (event ID)
  TEMPLATES: 'photobooth_layout_templates',       // LayoutTemplate[]
  THEME: 'theme',                                 // 'light' | 'dark'
} as const;
```

### Data Structure Example

```json
{
  "photobooth_events": [
    {
      "id": "evt_123",
      "name": "Wedding Reception",
      "date": "2026-03-15",
      "createdAt": 1738800000000,
      "updatedAt": 1738800000000,
      "paperSize": "strip",
      "template": "wedding",
      "launchPage": { ... },
      "camera": {
        "deviceId": "abc123",
        "source": "hdmi",
        "isMirrored": true
      },
      "countdown": {
        "enabled": true,
        "duration": 5,
        "beforeCapture": true,
        "beforePrint": false,
        "showAnimation": true,
        "soundEnabled": true
      },
      "printLayout": { ... },
      "printing": { ... },
      "printer": { ... }
    }
  ],
  "photobooth_active_event": "evt_123",
  "photobooth_layout_templates": [ ... ],
  "theme": "dark"
}
```
