# Components Reference

## Overview

The application uses a component-based architecture with React 19 and TypeScript. Components are organized by feature domain.

## Component Categories

### Page Components

| Component | Path | Description |
|-----------|------|-------------|
| `HomePage` | `app/page.tsx` | Landing page with hero, features, about sections |
| `BoothPage` | `app/booth/page.tsx` | Main app with sidebar, settings, and kiosk |

### Kiosk Components

```
components/kiosk/
├── KioskMode.tsx      # Main container, fullscreen, ESC handling
├── LaunchScreen.tsx   # Welcome screen with draggable elements
├── CaptureFlow.tsx    # Photo capture sequence controller
└── ResultScreen.tsx   # Preview with download/print options
```

**KioskMode.tsx**
- Entry point for kiosk mode
- Manages fullscreen state
- Handles ESC key to exit
- Coordinates between LaunchScreen, CaptureFlow, and ResultScreen

**LaunchScreen.tsx**
- Renders configured welcome page
- Displays draggable elements (text, images, buttons)
- "Start" button triggers capture flow

**CaptureFlow.tsx**
- Countdown timer before each capture
- Camera preview with live filters
- Progresses through configured photo count
- Flash animation on capture

**ResultScreen.tsx**
- Shows composed photo strip
- Download button
- Print button
- Retake/New session options

### Event Management Components

```
components/events/
├── EventSidebar.tsx      # Event list and CRUD actions
├── EventSettings.tsx     # Tabbed settings container
└── tabs/
    ├── LaunchPageBuilder.tsx    # Drag-drop launch page editor
    ├── CameraSetup.tsx          # Camera source selection
    ├── CountdownSettings.tsx    # Timer configuration
    ├── PrintLayoutSettings.tsx  # Layout designer
    ├── PrintingSettings.tsx     # Print output settings
    └── PrinterSetup.tsx         # Printer connection
```

**EventSidebar.tsx**
```typescript
interface Props {
  events: PhotoboothEvent[];
  activeEventId: string | null;
  onSelect: (id: string) => void;
  onCreate: (paperSize: PaperSize) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLaunch: (id: string) => void;
}
```

**EventSettings.tsx**
- 6 tabbed sections
- Auto-saves changes to event store
- Validates configuration before kiosk launch

### Layout Editor Components

```
components/layout-editor/
├── LayoutCanvas.tsx         # Main canvas with paper preview
├── PhotoBox.tsx             # Draggable/resizable photo box
├── TemplatePanel.tsx        # Template selection & management
├── BoxPropertiesPanel.tsx   # Property editor panel
├── SnapGuidelines.tsx       # Visual snap guides
└── PrintRenderer.tsx        # Live preview renderer
```

**LayoutCanvas.tsx**
```typescript
interface Props {
  paperSize: PaperSize;
  boxes: BoxConfig[];
  selectedBox: string | null;
  backgroundImage?: string;
  frameTemplate?: string;
  onBoxUpdate: (id: string, updates: Partial<BoxConfig>) => void;
  onBoxSelect: (id: string | null) => void;
}
```

**PhotoBox.tsx**
- Draggable with @dnd-kit
- Resizable from corners/edges
- Snap-to-grid and snap-to-other-boxes
- Selection state with handles

**TemplatePanel.tsx**
- Built-in templates (4-photo strip, 3-photo, single)
- User-saved templates
- Save current layout as template
- Delete user templates

### Camera Components

```
components/camera/
├── CameraProvider.tsx          # Camera state context
├── CameraPreview.tsx           # Video feed display
├── CameraControls.tsx          # Mirror toggle, settings
├── CameraSourceSelector.tsx    # Source dropdown
├── DSLRTetherView.tsx          # USB DSLR interface
└── WiFiCameraView.tsx          # WiFi polling interface
```

**CameraProvider.tsx**
```typescript
interface CameraContextValue {
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  activeDevice: string | null;
  source: CameraSource;
  isMirrored: boolean;
  permissions: PermissionState;
  isLoading: boolean;
  error: string | null;

  setSource: (source: CameraSource) => void;
  setDevice: (deviceId: string) => void;
  toggleMirror: () => void;
  startStream: () => Promise<void>;
  stopStream: () => void;
  capture: () => Promise<string>; // Returns data URL
}
```

**CameraPreview.tsx**
```typescript
interface Props {
  stream: MediaStream;
  mirrored?: boolean;
  filter?: string;
  overlay?: string;
  onCapture?: (dataUrl: string) => void;
}
```

### Capture Components

```
components/capture/
├── CaptureButton.tsx    # Large tap target
├── CaptureFlash.tsx     # Flash animation
├── CaptureMode.tsx      # Mode selector
└── CountdownTimer.tsx   # Animated countdown
```

**CountdownTimer.tsx**
```typescript
interface Props {
  duration: number;      // Seconds
  onComplete: () => void;
  showAnimation?: boolean;
  soundEnabled?: boolean;
}
```

### Photo Strip Components

```
components/photo-strip/
├── PhotoStrip.tsx          # Strip container
├── PhotoSlot.tsx           # Individual slot
├── PhotoStripCanvas.tsx    # Canvas renderer
└── index.ts
```

**PhotoStripCanvas.tsx**
```typescript
interface Props {
  photos: CapturedPhoto[];
  layout: PrintLayoutConfig;
  width: number;
  height: number;
  onRender?: (canvas: HTMLCanvasElement) => void;
}
```

### Printing Components

```
components/printing/
├── PrintButton.tsx        # Print trigger
├── PrinterSetup.tsx       # Printer config UI
├── PrintSizeSelector.tsx  # Size selection
├── usePrinter.ts          # Printer hook
└── index.ts
```

**usePrinter Hook**
```typescript
interface UsePrinterReturn {
  isConnected: boolean;
  printerInfo: PrinterInfo | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  print: (imageData: Blob, options: PrintOptions) => Promise<void>;
}
```

### Preview Components

```
components/preview/
├── FinalPreview.tsx      # Preview modal
├── DownloadButton.tsx    # Download trigger
├── QRCodeDisplay.tsx     # QR generator
└── index.ts
```

### Filter Components

```
components/filters/
├── FilterSelector.tsx    # Filter UI
├── filters.ts            # Filter definitions
└── index.ts
```

**Available Filters**
- None (original)
- Grayscale
- Sepia
- Vintage
- High Contrast
- Warm
- Cool
- Dramatic

### UI Components (shadcn/ui)

```
components/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── select.tsx
├── slider.tsx
├── switch.tsx
├── tabs.tsx
├── toast.tsx
└── ... (25+ components)
```

## Component Patterns

### State Updates

All event updates go through the `useEvents` hook:

```typescript
const { activeEvent, updateEvent } = useEvents();

// Update camera settings
const handleCameraChange = (deviceId: string) => {
  updateEvent(activeEvent.id, {
    camera: { ...activeEvent.camera, deviceId }
  });
};
```

### Error Boundaries

Components use try-catch and error states:

```typescript
const [error, setError] = useState<string | null>(null);

try {
  await camera.startStream();
} catch (e) {
  setError(e.message);
}
```

### Loading States

Components show loading indicators during async operations:

```typescript
const [isLoading, setIsLoading] = useState(false);

return isLoading ? <Spinner /> : <Content />;
```

### Responsive Design

Components use Tailwind breakpoints:

```tsx
<div className="flex flex-col md:flex-row lg:grid lg:grid-cols-3">
  {/* Responsive layout */}
</div>
```

## Props Reference

### Common Props

```typescript
// Styling
className?: string;

// State
isLoading?: boolean;
isDisabled?: boolean;
error?: string | null;

// Callbacks
onChange?: (value: T) => void;
onSubmit?: () => void;
onCancel?: () => void;
```

### Event Props Pattern

```typescript
interface EventComponentProps {
  event: PhotoboothEvent;
  onUpdate: (updates: Partial<PhotoboothEvent>) => void;
}
```

### Layout Props Pattern

```typescript
interface LayoutComponentProps {
  layout: PrintLayoutConfig;
  selectedBox?: string | null;
  onLayoutChange: (layout: PrintLayoutConfig) => void;
  onBoxSelect?: (id: string | null) => void;
}
```
