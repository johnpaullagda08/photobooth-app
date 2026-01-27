// Camera types
export type CameraSource = 'webcam' | 'hdmi' | 'usb-tether' | 'wifi';

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export interface CameraState {
  stream: MediaStream | null;
  devices: CameraDevice[];
  activeDevice: string | null;
  source: CameraSource;
  isMirrored: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  isLoading: boolean;
  error: string | null;
}

export type CameraAction =
  | { type: 'SET_STREAM'; payload: MediaStream | null }
  | { type: 'SET_DEVICES'; payload: CameraDevice[] }
  | { type: 'SET_ACTIVE_DEVICE'; payload: string }
  | { type: 'SET_SOURCE'; payload: CameraSource }
  | { type: 'TOGGLE_MIRROR' }
  | { type: 'SET_PERMISSION'; payload: 'prompt' | 'granted' | 'denied' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Capture types
export type CaptureMode = 'single' | 'multi';
export type PhotoCount = 3 | 4;
export type CountdownDuration = 3 | 5 | 8 | 10;

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  filterId: string;
}

export interface CaptureState {
  mode: CaptureMode;
  photoCount: PhotoCount;
  countdownDuration: CountdownDuration;
  photos: CapturedPhoto[];
  isCapturing: boolean;
  currentPhotoIndex: number;
}

// Filter types
export interface Filter {
  id: string;
  name: string;
  cssFilter: string;
  thumbnail?: string;
}

// Overlay types
export interface Overlay {
  id: string;
  name: string;
  type: 'frame' | 'logo' | 'text' | 'datetime';
  src?: string;
  text?: string;
  position?: 'top' | 'bottom' | 'center';
  style?: Record<string, string>;
}

// Theme types
export type ThemePreset = 'wedding' | 'party' | 'corporate' | 'custom';

export interface Theme {
  id: string;
  name: string;
  preset: ThemePreset;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderStyle: 'none' | 'solid' | 'double' | 'dashed';
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  overlayIds: string[];
}

// Print types
export type PrintSize = '2x6' | '4x6';

export interface PrintFormat {
  size: PrintSize;
  width: number;
  height: number;
  dpi: number;
  label: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'browser';
  connectionType: 'usb' | 'network' | 'browser';
  address?: string;
}

// App state types
export type AppScreen = 'landing' | 'camera' | 'preview' | 'final';

export interface AppState {
  screen: AppScreen;
  captureState: CaptureState;
  selectedFilter: string;
  selectedOverlays: string[];
  selectedTheme: string;
  customTheme: Theme | null;
}

// Export options
export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality: number; // 0-1 for JPEG
  dpi: number;
}

// USB Tether types
export interface TetheredCamera {
  model: string;
  port: string;
  serial?: string;
}

export interface TetherCaptureResult {
  success: boolean;
  imagePath?: string;
  imageData?: string;
  error?: string;
}

// WiFi polling types
export interface WiFiPollConfig {
  folderPath: string;
  pollInterval: number;
  extensions: string[];
}

export interface WiFiImageResult {
  filename: string;
  imageData: string;
  timestamp: number;
}
