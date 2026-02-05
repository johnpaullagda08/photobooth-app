# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (BROWSER)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Next.js    │  │    React     │  │   Tailwind   │  │   Framer     │    │
│  │  App Router  │  │     19       │  │   CSS v4     │  │   Motion     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        COMPONENT LAYER                               │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │   Pages   │  │   Kiosk   │  │  Layout   │  │  Camera   │        │    │
│  │  │  (booth)  │  │   Mode    │  │  Editor   │  │ Controls  │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          STATE LAYER                                 │    │
│  │  ┌───────────────────┐  ┌───────────────────┐                       │    │
│  │  │   Event Store     │  │   Camera Context  │                       │    │
│  │  │  (localStorage)   │  │   (React Context) │                       │    │
│  │  └───────────────────┘  └───────────────────┘                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        SERVICE LAYER                                 │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │  Canvas   │  │  WebRTC   │  │  WebUSB   │  │   File    │        │    │
│  │  │ Composer  │  │  Camera   │  │  Printer  │  │  Export   │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ (Optional Server Features)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Node.js)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │   gPhoto2 API     │  │   WiFi Polling    │  │   File System     │       │
│  │  (DSLR Tether)    │  │   (Image Watch)   │  │    Operations     │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
photobooth-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── booth/page.tsx            # Main application
│   ├── layout.tsx                # Root layout
│   ├── manifest.json             # PWA manifest
│   └── api/                      # API routes (server features)
│       ├── camera/               # DSLR tethering APIs
│       └── wifi/                 # WiFi polling API
│
├── components/                    # React Components
│   ├── camera/                   # Camera management
│   ├── capture/                  # Photo capture
│   ├── events/                   # Event management
│   │   └── tabs/                 # Settings tabs
│   ├── kiosk/                    # Kiosk mode
│   ├── layout-editor/            # Print layout designer
│   ├── photo-strip/              # Strip rendering
│   ├── printing/                 # Print functionality
│   ├── preview/                  # Final preview
│   ├── filters/                  # Photo filters
│   ├── overlays/                 # Frame overlays
│   ├── themes/                   # Theme management
│   ├── providers/                # Context providers
│   └── ui/                       # shadcn/ui components
│
├── hooks/                        # Custom React Hooks
│   ├── useCameraStream.ts        # Camera stream
│   ├── useCaptureSequence.ts     # Capture logic
│   ├── useCountdown.ts           # Countdown timer
│   ├── useFullscreen.ts          # Fullscreen API
│   ├── useLocalStorage.ts        # localStorage
│   └── layout-editor/            # Layout hooks
│
├── lib/                          # Utility Libraries
│   ├── camera/                   # Camera adapters
│   ├── canvas/                   # Image composition
│   ├── events/                   # Event state
│   ├── printing/                 # Printer integration
│   ├── photos/                   # Photo utilities
│   └── utils.ts                  # General utilities
│
├── constants/                    # App constants
├── types/                        # TypeScript definitions
├── public/                       # Static assets
└── tests/                        # E2E tests
```

## State Management

### Event Store (localStorage)

The primary state management uses a custom `useEvents` hook that persists to localStorage:

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

### Storage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `photobooth_events` | PhotoboothEvent[] | All event configurations |
| `photobooth_active_event` | string | Currently selected event ID |
| `photobooth_layout_templates` | LayoutTemplate[] | User-saved templates |
| `theme` | 'light' \| 'dark' | UI theme preference |

### Camera Context

Camera state is managed via React Context:

```typescript
interface CameraState {
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  activeDevice: string | null;
  source: CameraSource;
  isMirrored: boolean;
  permissions: 'granted' | 'denied' | 'prompt';
  isLoading: boolean;
  error: string | null;
}
```

## Data Flow

### Event Settings Flow

```
User Input → EventSettings → updateEvent() → localStorage → UI Update
```

### Capture Flow

```
CaptureButton → useCountdown → Camera.capture() → Canvas.render() → Photo Store
```

### Print Flow

```
ResultScreen → Canvas.compose() → Export (PNG/JPEG) → WebUSB/Browser Print
```

## Camera Architecture

### Device Detection

```typescript
type CameraDeviceType = 'webcam' | 'hdmi-capture' | 'mirrorless' | 'virtual' | 'unknown';

// Detection by label patterns
const MIRRORLESS_PATTERNS = ['Sony', 'Canon EOS', 'Nikon Z', 'Fujifilm', ...];
const HDMI_PATTERNS = ['Elgato', 'AVerMedia', 'Blackmagic', ...];
```

### Source Adapters

| Source | Implementation | Requirements |
|--------|----------------|--------------|
| webcam | MediaDevices API | Browser support |
| hdmi | MediaDevices API | Capture card |
| usb-tether | gPhoto2 + API | Local server |
| wifi | File polling + API | Local server |

## Print Layout System

### Coordinate System

All positions use percentages (0-100) for responsive layouts:

```typescript
interface BoxConfig {
  id: string;
  label: string;
  x: number;      // 0-100 (left edge)
  y: number;      // 0-100 (top edge)
  width: number;  // 0-100
  height: number; // 0-100
}
```

### Paper Sizes

| Format | Dimensions | Pixel Size (300 DPI) |
|--------|------------|----------------------|
| 2x6 Strip | 2" × 6" | 600 × 1800 px |
| 4x6 (4R) | 4" × 6" | 1200 × 1800 px |

## API Routes

### /api/camera/devices

Lists available camera devices (including gPhoto2-detected DSLRs).

### /api/camera/capture

Triggers capture on tethered DSLR via gPhoto2.

### /api/camera/tether

Returns information about currently tethered camera.

### /api/wifi/poll

Polls specified folder for new images from WiFi-enabled cameras.

## Deployment Modes

### Static (Cloudflare Pages)

- Webcam/HDMI capture only
- localStorage persistence
- WebUSB printing (limited)
- No server-side features

### Full (Local Server)

- All camera sources
- File system access
- Full printing support
- DSLR tethering via gPhoto2
