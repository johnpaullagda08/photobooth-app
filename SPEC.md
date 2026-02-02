# Log the Photobooth - OpenSpec Specification

**Version**: 1.2.0
**Status**: Active Development
**Last Updated**: 2026-02-02
**Author**: John Paul Lagda

---

## 1. Overview

### 1.1 Project Summary

| Field | Value |
|-------|-------|
| **Name** | Log the Photobooth |
| **Type** | Web Application (PWA) |
| **Framework** | Next.js 16.1.4 |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 + Tailwind CSS + shadcn/ui |

### 1.2 Description

**Log the Photobooth** is a modern, browser-based photobooth application designed for events of all sizes. Whether you're hosting a wedding, birthday party, corporate event, or any special occasion, the platform makes it easy to capture, customize, and print memorable photos.

The application features a powerful event management system, multi-camera support (webcam, DSLR via HDMI capture, mirrorless via USB, WiFi transfer), customizable print layouts, and instant printing capabilities.

### 1.3 Key Features

- **Event Management**: Create and manage multiple events with unique settings, layouts, and configurations
- **Multi-Camera Support**: Webcam, HDMI capture cards, mirrorless cameras via USB, WiFi transfer
- **Paper Size Options**: 2x6 inch photo strips or 4x6 inch (4R) photos
- **Print Layout Editor**: Drag-and-drop layout designer with custom backgrounds and frame overlays
- **Template System**: Save and reuse templates across events
- **Live Camera Preview**: Real-time preview with countdown timer
- **Kiosk Mode**: Fullscreen touchscreen-friendly interface for events
- **Instant Printing**: Direct thermal printer support with download option
- **Mobile Friendly**: Fully responsive design for tablets, iPads, and phones
- **PWA Support**: Installable web app with offline capabilities
- **Network Access**: Support for multi-device access via local network

### 1.4 Contact Information

| Field | Value |
|-------|-------|
| **Developer** | John Paul Lagda |
| **Email** | johnpaullagda08@gmail.com |
| **Facebook** | https://www.facebook.com/johnpaullagda08/ |

---

## 2. Architecture

### 2.1 Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  React 19  │  Tailwind CSS  │  Framer Motion  │ shadcn │
├─────────────────────────────────────────────────────────┤
│              State Management (Context + Hooks)          │
├─────────────────────────────────────────────────────────┤
│    localStorage    │    Canvas API    │   WebRTC       │
├─────────────────────────────────────────────────────────┤
│                    API Routes (Next.js)                  │
├─────────────────────────────────────────────────────────┤
│   gPhoto2 (DSLR)   │   WebUSB (Printers)  │  File I/O  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
photobooth-app/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── camera/        # Camera APIs (capture, devices, tether)
│   │   └── wifi/          # WiFi camera polling
│   ├── booth/             # Main booth page (Event Manager)
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Landing page (Homepage)
│   └── manifest.json      # PWA manifest
├── components/            # React components
│   ├── camera/            # Camera management
│   ├── capture/           # Photo capture
│   ├── events/            # Event management
│   │   └── tabs/          # Settings tabs (6 tabs)
│   ├── kiosk/             # Kiosk mode screens
│   ├── layout-editor/     # Print layout components
│   ├── photo-strip/       # Strip rendering
│   ├── printing/          # Print functionality
│   └── ui/                # shadcn/ui components
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── camera/            # Camera adapters & error handling
│   ├── canvas/            # Image composition
│   ├── events/            # Event state management
│   └── printing/          # Printer integration
├── public/                # Static assets
├── tests/                 # E2E tests (Playwright)
└── types/                 # TypeScript definitions
```

---

## 3. Data Models

### 3.1 PhotoboothEvent

The core data model representing a photobooth event configuration.

```typescript
interface PhotoboothEvent {
  id: string;
  name: string;
  date: string;                    // ISO date string
  createdAt: number;
  updatedAt: number;
  paperSize: PaperSize;            // 'strip' | '4r'
  template: 'wedding' | 'birthday' | 'corporate' | 'custom';

  launchPage: LaunchPageConfig;
  camera: CameraConfig;
  countdown: CountdownConfig;
  printLayout: PrintLayoutConfig;
  printing: PrintingConfig;
  printer: PrinterConfig;
}

type PaperSize = 'strip' | '4r';   // 2x6 strip or 4x6 (4R)
```

### 3.2 LaunchPageConfig

Customizable welcome screen with draggable elements.

```typescript
interface LaunchPageConfig {
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOpacity: number;       // 0-100
  elements: DraggableElement[];
}

interface DraggableElement {
  id: string;
  type: 'text' | 'logo' | 'image' | 'button' | 'shape';
  x: number;                       // percentage 0-100
  y: number;                       // percentage 0-100
  width: number;                   // percentage
  height: number;                  // percentage
  rotation: number;                // degrees
  visible: boolean;
  locked: boolean;
  zIndex: number;
  properties: ElementProperties;
}
```

### 3.3 CameraConfig

```typescript
interface CameraConfig {
  deviceId: string | null;
  source: 'webcam' | 'hdmi' | 'usb-tether' | 'wifi';
  isMirrored: boolean;
}
```

### 3.4 PrintLayoutConfig

```typescript
interface PrintLayoutConfig {
  format: '2x6-strip' | '4x6-4r';
  orientation: 'portrait' | 'landscape';
  photoCount: 1 | 3 | 4;
  layoutPreset: 'grid' | 'custom';
  margins: { top: number; right: number; bottom: number; left: number };
  spacing: number;
  boxes: BoxConfig[];
  frameTemplate: string | null;     // Frame overlay image (data URL)
  backgroundImage: string | null;   // Background image (data URL)
  backgroundColor: string;          // Background color (hex)
  overlays: OverlayConfig[];
}

interface BoxConfig {
  id: string;
  label: string;
  x: number;      // percentage
  y: number;      // percentage
  width: number;  // percentage
  height: number; // percentage
}
```

### 3.5 CountdownConfig

```typescript
interface CountdownConfig {
  enabled: boolean;
  duration: 3 | 5 | 8 | 10;        // seconds
  beforeCapture: boolean;
  beforePrint: boolean;
  showAnimation: boolean;
  soundEnabled: boolean;
}
```

### 3.6 LayoutTemplate (Template System)

```typescript
interface LayoutTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  boxes: BoxConfig[];
  backgroundImage?: string | null;
  frameTemplate?: string | null;
  backgroundColor?: string;
  isBuiltIn?: boolean;
}
```

---

## 4. Components

### 4.1 Core Components

| Component | Path | Purpose |
|-----------|------|---------|
| `KioskMode` | `/components/kiosk/KioskMode.tsx` | Main kiosk container with fullscreen and ESC handling |
| `LaunchScreen` | `/components/kiosk/LaunchScreen.tsx` | Welcome page renderer |
| `CaptureFlow` | `/components/kiosk/CaptureFlow.tsx` | Photo capture sequence controller |
| `ResultScreen` | `/components/kiosk/ResultScreen.tsx` | Final preview with download/print |

### 4.2 Event Management

| Component | Path | Purpose |
|-----------|------|---------|
| `EventSidebar` | `/components/events/EventSidebar.tsx` | Event list with CRUD operations |
| `EventSettings` | `/components/events/EventSettings.tsx` | Tabbed settings interface (6 tabs) |
| `LaunchPageBuilder` | `/components/events/tabs/LaunchPageBuilder.tsx` | Drag-drop page editor |
| `CameraSetup` | `/components/events/tabs/CameraSetup.tsx` | Camera source selection |
| `CountdownSettings` | `/components/events/tabs/CountdownSettings.tsx` | Timer configuration |
| `PrintLayoutSettings` | `/components/events/tabs/PrintLayoutSettings.tsx` | Layout designer with templates |
| `PrintingSettings` | `/components/events/tabs/PrintingSettings.tsx` | Print output settings |
| `PrinterSetup` | `/components/events/tabs/PrinterSetup.tsx` | Printer connection |

### 4.3 Layout Editor Components

| Component | Path | Purpose |
|-----------|------|---------|
| `LayoutCanvas` | `/components/layout-editor/LayoutCanvas.tsx` | Interactive layout canvas |
| `TemplatePanel` | `/components/layout-editor/TemplatePanel.tsx` | Template selection and management |
| `BoxPropertiesPanel` | `/components/layout-editor/BoxPropertiesPanel.tsx` | Photo box property editor |

### 4.4 Camera Components

| Component | Path | Purpose |
|-----------|------|---------|
| `CameraProvider` | `/components/camera/CameraProvider.tsx` | Camera state context |
| `CameraPreview` | `/components/camera/CameraPreview.tsx` | Video feed display |
| `DSLRTetherView` | `/components/camera/DSLRTetherView.tsx` | USB DSLR interface |

---

## 5. User Flows

### 5.1 Event Setup Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Create Event │───>│ Choose Paper │───>│ Customize    │
│ (Name, Date) │    │ Size (Strip/ │    │ Launch Page  │
│              │    │ 4R)          │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Launch       │<───│ Configure    │<───│ Setup Camera │
│ Kiosk Mode   │    │ Print Layout │    │ & Countdown  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 5.2 Kiosk Capture Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Launch       │───>│ User Taps    │───>│ Countdown    │
│ Screen       │    │ Start Button │    │ (3-10 sec)   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Result       │<───│ Repeat for   │<───│ Capture      │
│ Screen       │    │ All Photos   │    │ Photo        │
└──────────────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐
│ Download or  │───>│ New Session  │
│ Print        │    │ or Retake    │
└──────────────┘    └──────────────┘
```

### 5.3 Print Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Compose      │───>│ Render to    │───>│ Export as    │
│ Photo Strip  │    │ Canvas       │    │ JPEG/PNG     │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                   │ WebUSB       │    │ Network      │    │ Browser      │
                   │ Thermal      │    │ Printer      │    │ Print Dialog │
                   └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 6. API Endpoints

### 6.1 Camera APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/camera/devices` | GET | List available camera devices |
| `/api/camera/capture` | POST | Capture image from tethered DSLR |
| `/api/camera/tether` | GET | Get tethered camera info |

### 6.2 WiFi Camera API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wifi/poll` | POST | Poll WiFi camera for new images |

---

## 7. State Management

### 7.1 Event Store

Events are persisted to localStorage using a custom hook:

```typescript
// lib/events/store.ts
function useEvents() {
  const [events, setEvents] = useState<PhotoboothEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // CRUD operations
  const createEvent = (paperSize: PaperSize) => { ... };
  const updateEvent = (id: string, updates: Partial<PhotoboothEvent>) => { ... };
  const deleteEvent = (id: string) => { ... };
  const duplicateEvent = (id: string) => { ... };
  const selectEvent = (id: string) => { ... };

  return { events, activeEvent, createEvent, updateEvent, ... };
}
```

### 7.2 Storage Keys

| Key | Data Type | Purpose |
|-----|-----------|---------|
| `photobooth-events` | PhotoboothEvent[] | All event configurations |
| `photobooth-active-event` | string | Currently selected event ID |
| `photobooth_layout_templates` | LayoutTemplate[] | User-saved layout templates |
| `theme` | 'light' \| 'dark' | UI theme preference |

---

## 8. Camera System

### 8.1 Device Detection

The camera system includes intelligent device detection for various camera types:

```typescript
type CameraDeviceType = 'webcam' | 'hdmi-capture' | 'mirrorless' | 'virtual' | 'unknown';

interface DetectedCameraDevice {
  deviceId: string;
  label: string;
  type: CameraDeviceType;
  brand?: string;
  isLikelyProfessional: boolean;
}
```

### 8.2 Supported Camera Brands

| Type | Supported Brands |
|------|------------------|
| **Mirrorless (USB)** | Sony (Alpha, ZV), Canon (EOS R), Nikon (Z), Fujifilm (X), Panasonic (Lumix), Olympus, Leica, Sigma |
| **HDMI Capture** | Elgato, AVerMedia, Blackmagic, Magewell, Atomos, Razer |
| **Webcams** | Logitech, Microsoft, Razer Kiyo, Creative, Built-in cameras |

### 8.3 Network Access Requirements

Camera access requires a secure context (HTTPS):

| Access Method | Camera Available |
|---------------|------------------|
| `localhost` | Yes |
| `127.0.0.1` | Yes |
| `https://domain.com` | Yes |
| `http://192.168.x.x` | No (requires HTTPS) |

For network access on tablets/iPads, enable HTTPS or use a tunneling service like ngrok.

---

## 9. Photo Strip Specifications

### 9.1 Paper Sizes

| Paper Size | Dimensions | DPI | Orientation |
|------------|------------|-----|-------------|
| **2x6 Strip** | 600 x 1800 px | 300 | Portrait |
| **4x6 (4R)** | 1800 x 1200 px | 300 | Landscape |

### 9.2 Photo Layout (4 Photos - Strip)

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │   Photo 1     │  │  y: 5%, height: 22%
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   Photo 2     │  │  y: 29%, height: 22%
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   Photo 3     │  │  y: 53%, height: 22%
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   Photo 4     │  │  y: 77%, height: 22%
│  └───────────────┘  │
└─────────────────────┘
   x: 5%, width: 90%
```

---

## 10. Styling

### 10.1 Design Tokens

```css
/* Color Palette */
--primary: #f43f5e;        /* Rose (brand color) */
--secondary: #f97316;      /* Orange (accent) */
--destructive: #ef4444;    /* Red */
--success: #22c55e;        /* Green */
--muted: #71717a;          /* Gray */
--background: #0a0a0a;     /* Dark mode default */
--foreground: #fafafa;     /* Text */

/* Spacing Scale */
--spacing-1: 0.25rem;      /* 4px */
--spacing-2: 0.5rem;       /* 8px */
--spacing-4: 1rem;         /* 16px */
--spacing-6: 1.5rem;       /* 24px */
--spacing-8: 2rem;         /* 32px */

/* Border Radius */
--radius-sm: 0.375rem;     /* 6px */
--radius-md: 0.5rem;       /* 8px */
--radius-lg: 0.75rem;      /* 12px */
--radius-xl: 1rem;         /* 16px */
```

### 10.2 Responsive Breakpoints

```css
/* Tailwind CSS Breakpoints */
sm: 640px;   /* Small tablets */
md: 768px;   /* Tablets (iPad) */
lg: 1024px;  /* Laptops */
xl: 1280px;  /* Desktops */
```

---

## 11. Printer Support

### 11.1 Supported Connection Types

| Type | Protocol | Use Case |
|------|----------|----------|
| WebUSB | USB direct | Thermal printers (DNP, HiTi) |
| Network | IPP / Raw Socket | Network printers |
| Browser | window.print() | Fallback for any printer |

### 11.2 Supported USB Vendor IDs

```typescript
const THERMAL_PRINTER_VENDORS = [
  0x1343, // DNP
  0x0D16, // HiTi
  0x04F9, // Brother
  0x067B, // Prolific (USB-Serial adapters)
];
```

---

## 12. Testing

### 12.1 E2E Tests (Playwright)

| Test File | Coverage |
|-----------|----------|
| `tests/home.spec.ts` | Landing page functionality |
| `tests/booth.spec.ts` | Booth page, event management |

### 12.2 Running Tests

```bash
# Install browsers
npx playwright install

# Run all tests
npm test

# Run with UI
npx playwright test --ui
```

---

## 13. Development

### 13.1 Prerequisites

- Node.js 18+
- npm or pnpm
- gPhoto2 (for DSLR tethering, optional)

### 13.2 Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 13.3 Environment Variables

```env
# Optional: gPhoto2 path (defaults to system path)
GPHOTO2_PATH=/usr/local/bin/gphoto2

# Optional: Temp directory for captures
CAPTURE_TEMP_DIR=/tmp/photobooth-captures
```

---

## 14. Deployment

### 14.1 Deployment Options

| Platform | Type | Features | Best For |
|----------|------|----------|----------|
| **Cloudflare Pages** | Static | Webcam, HDMI, templates, export | Public hosting |
| **Local Server** | Full | All features including USB tethering | Event venues |
| **Docker** | Full | All features | Self-hosted |

### 14.2 Cloudflare Pages (Recommended for Hosting)

**Live URL**: https://photobooth-ru7.pages.dev

#### Setup

```bash
# Install Wrangler CLI (already in devDependencies)
npm install -D wrangler

# Login to Cloudflare
npx wrangler login

# Create project (first time only)
npx wrangler pages project create photobooth --production-branch=main

# Deploy
npm run deploy
```

#### Deploy Commands

```bash
npm run deploy           # Deploy to production
npm run deploy:preview   # Deploy preview branch
npm run build:static     # Build static export only
```

#### Feature Availability on Cloudflare

| Feature | Available | Notes |
|---------|-----------|-------|
| Landing page | Yes | Full animations |
| Event management | Yes | localStorage persistence |
| Webcam capture | Yes | Browser MediaDevices API |
| HDMI capture | Yes | Browser MediaDevices API |
| Mirrorless (USB) | Yes | Browser MediaDevices API |
| Print layout editor | Yes | Canvas-based editor |
| Template backgrounds | Yes | Data URL storage |
| Photo strip generation | Yes | Canvas API |
| Download/export | Yes | Blob download |
| USB tethering (DSLR) | No | Requires gPhoto2 server |
| WiFi transfer | No | Requires server polling |
| Direct thermal printing | Partial | WebUSB works, no server print queue |

### 14.3 PWA Installation

The app includes a web manifest for PWA installation:

```json
{
  "name": "Log the Photobooth",
  "short_name": "Log Photobooth",
  "start_url": "/booth",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b"
}
```

---

## 15. Changelog

### Version 1.2.0 (2026-02-02)

- **Rebranded**: App renamed to "Log the Photobooth"
- **New**: Complete homepage redesign with About, Contact, and Footer sections
- **New**: Multi-device camera access support with secure context detection
- **New**: Mirrorless camera detection (Sony, Canon, Nikon, Fujifilm, Panasonic, Olympus, Leica, Sigma)
- **New**: Template background isolation - each template maintains independent settings
- **New**: Auto-save functionality for user templates
- **New**: Network access help guide for iPad/tablet users
- **Updated**: Camera setup with professional camera detection notices
- **Updated**: SEO-friendly metadata with keywords and author info
- **Fixed**: iPad `navigator.mediaDevices` undefined error
- **Fixed**: Template background inheritance bug
- **Fixed**: BoxPropertiesPanel overflow on narrow screens

### Version 1.1.0 (2026-01-28)

- **New**: Cloudflare Pages deployment support
- **New**: Static export build configuration
- **New**: Redesigned landing page with Fraxbit-inspired animations
- **Updated**: Camera source selector shows disabled state for server-only features
- **Added**: `npm run deploy` command for Cloudflare Pages

### Version 1.0.0 (2026-01-27)

- Initial release
- Multi-source camera support (webcam, HDMI, USB tether, WiFi)
- Photo strip creation with 2x6 format
- 8 real-time CSS filters
- Event management with templates
- Kiosk mode with fullscreen support
- WebUSB thermal printer integration
- PWA support with installability

---

## 16. License

MIT License - See LICENSE file for details.

---

## 17. Support & Contact

**Developer**: John Paul Lagda
**Email**: johnpaullagda08@gmail.com
**Facebook**: https://www.facebook.com/johnpaullagda08/

For issues and feature requests, please reach out via email or social media.
