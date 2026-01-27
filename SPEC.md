# Photobooth App - OpenSpec Specification

**Version**: 1.0.0
**Status**: Active Development
**Last Updated**: 2026-01-27
**Author**: Development Team

---

## 1. Overview

### 1.1 Project Summary

| Field | Value |
|-------|-------|
| **Name** | Photobooth App |
| **Type** | Web Application (PWA) |
| **Framework** | Next.js 16.1.4 |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 + Tailwind CSS + shadcn/ui |

### 1.2 Description

A professional-grade photobooth application designed for events such as weddings, parties, and corporate gatherings. The app supports multiple camera sources, customizable photo strips, real-time filters, and direct printing to thermal printers.

### 1.3 Key Features

- **Multi-Source Camera Support**: Webcam, HDMI capture, USB tethered DSLR, WiFi cameras
- **Photo Strip Creation**: 2x6 inch strips with 3-4 photos
- **Real-Time Filters**: 8 CSS-based photo filters
- **Event Management**: Create, customize, and manage multiple events
- **Kiosk Mode**: Fullscreen touchscreen-friendly interface
- **Direct Printing**: WebUSB thermal printer support
- **PWA Support**: Installable web app with offline capabilities

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
│   ├── booth/             # Main booth page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── manifest.json      # PWA manifest
├── components/            # React components
│   ├── camera/            # Camera management
│   ├── capture/           # Photo capture
│   ├── events/            # Event management
│   │   └── tabs/          # Settings tabs
│   ├── kiosk/             # Kiosk mode screens
│   ├── photo-strip/       # Strip rendering
│   ├── printing/          # Print functionality
│   └── ui/                # shadcn/ui components
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── camera/            # Camera adapters
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
  template: 'wedding' | 'birthday' | 'corporate' | 'custom';

  launchPage: LaunchPageConfig;
  camera: CameraConfig;
  countdown: CountdownConfig;
  printLayout: PrintLayoutConfig;
  printing: PrintingConfig;
  printer: PrinterConfig;
}
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
  format: '2x6-strip';
  orientation: 'portrait' | 'landscape';
  photoCount: 3 | 4;
  layoutPreset: 'grid' | 'custom';
  margins: { top: number; right: number; bottom: number; left: number };
  spacing: number;
  boxes: BoxConfig[];
  frameTemplate: string | null;
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
| `EventSidebar` | `/components/events/EventSidebar.tsx` | Event list with CRUD |
| `EventSettings` | `/components/events/EventSettings.tsx` | Tabbed settings interface |
| `LaunchPageBuilder` | `/components/events/tabs/LaunchPageBuilder.tsx` | Drag-drop page editor |
| `PrintLayoutSettings` | `/components/events/tabs/PrintLayoutSettings.tsx` | Photo layout designer |

### 4.3 Camera Components

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
│ Create Event │───>│ Choose       │───>│ Customize    │
│ or Template  │    │ Template     │    │ Launch Page  │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Launch       │<───│ Configure    │<───│ Setup Camera │
│ Kiosk Mode   │    │ Printing     │    │ & Countdown  │
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
  const createEvent = (template: EventTemplate) => { ... };
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
| `theme` | 'light' \| 'dark' | UI theme preference |

---

## 8. Styling

### 8.1 Design Tokens

```css
/* Color Palette */
--primary: #3b82f6;        /* Blue */
--destructive: #ef4444;    /* Red */
--success: #22c55e;        /* Green */
--muted: #71717a;          /* Gray */
--background: #ffffff;     /* Light mode */
--foreground: #09090b;     /* Text */

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

### 8.2 Responsive Breakpoints

```css
/* Tailwind CSS Breakpoints */
sm: 640px;   /* Small tablets */
md: 768px;   /* Tablets (iPad) */
lg: 1024px;  /* Laptops */
xl: 1280px;  /* Desktops */
```

---

## 9. Photo Strip Specifications

### 9.1 2x6 Strip Format

| Property | Portrait | Landscape |
|----------|----------|-----------|
| Width (px) | 600 | 1800 |
| Height (px) | 1800 | 600 |
| DPI | 300 | 300 |
| Physical Width | 2 inches | 6 inches |
| Physical Height | 6 inches | 2 inches |

### 9.2 Photo Layout (4 Photos - Grid)

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

## 10. Filters

### 10.1 Available CSS Filters

| Filter Name | CSS Value |
|-------------|-----------|
| Original | none |
| B&W | grayscale(100%) |
| Vintage | sepia(50%) contrast(90%) brightness(90%) |
| High Contrast | contrast(150%) saturate(110%) |
| Soft Glow | brightness(105%) contrast(95%) saturate(90%) blur(0.5px) |
| Warm | sepia(20%) saturate(110%) brightness(105%) |
| Cool | saturate(90%) brightness(105%) hue-rotate(10deg) |
| Dramatic | contrast(120%) saturate(130%) brightness(90%) |

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
- gPhoto2 (for DSLR tethering)

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

### 14.1 Production Build

```bash
npm run build
npm start
```

### 14.2 Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 14.3 PWA Installation

The app includes a web manifest (`app/manifest.json`) for PWA installation:

```json
{
  "name": "Photobooth App",
  "short_name": "Photobooth",
  "start_url": "/booth",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#3b82f6"
}
```

---

## 15. Changelog

### Version 1.0.0 (2026-01-27)

- Initial release
- Multi-source camera support (webcam, HDMI, USB tether, WiFi)
- Photo strip creation with 2x6 format
- 8 real-time CSS filters
- Event management with templates (wedding, birthday, corporate)
- Kiosk mode with fullscreen support
- WebUSB thermal printer integration
- PWA support with installability
- Responsive design for iPad and desktop

---

## 16. License

MIT License - See LICENSE file for details.

---

## 17. Support

For issues and feature requests, visit:
https://github.com/your-repo/photobooth-app/issues
