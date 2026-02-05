import type {
  CountdownDuration,
  PhotoCount,
  PrintFormat,
  Filter,
  Theme,
  Overlay,
} from '@/types';

// Camera constraints
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    facingMode: 'user',
    frameRate: { ideal: 30 },
  },
  audio: false,
};

// Photo strip dimensions (at 300 DPI)
export const STRIP_WIDTH = 600; // 2 inches at 300 DPI
export const STRIP_HEIGHT_3_PHOTOS = 1800; // 6 inches at 300 DPI
export const STRIP_HEIGHT_4_PHOTOS = 1800; // 6 inches at 300 DPI
export const PHOTO_SPACING = 10; // pixels between photos

// Default settings
export const DEFAULT_PHOTO_COUNT: PhotoCount = 4;
export const DEFAULT_COUNTDOWN_DURATION: CountdownDuration = 3;
export const DEFAULT_FILTER_ID = 'none';
export const DEFAULT_THEME_ID = 'party';

// Countdown options
export const COUNTDOWN_OPTIONS: CountdownDuration[] = [3, 5, 8, 10];

// Photo count options
export const PHOTO_COUNT_OPTIONS: PhotoCount[] = [3, 4];

// Print formats - ALL output uses 4R (4x6) canvas
// Strip mode: 2 strips side-by-side on 4R
// 4R mode: Single layout on 4R
export const PRINT_FORMATS: Record<string, PrintFormat> = {
  '2x6': {
    size: '2x6',
    width: 1200,    // Always 4R canvas width
    height: 1800,   // Always 4R canvas height
    dpi: 300,
    label: '2×6 Strip (2-up on 4R)',
  },
  '4x6': {
    size: '4x6',
    width: 1200,
    height: 1800,
    dpi: 300,
    label: '4×6 (4R) Photo',
  },
};

// 4R Canvas specifications (300 DPI)
export const PRINT_CANVAS = {
  WIDTH: 1200,      // 4 inches at 300 DPI
  HEIGHT: 1800,     // 6 inches at 300 DPI
  DPI: 300,
  SAFE_MARGIN: 20,  // 20px safe area on each side
} as const;

// Strip dimensions when printed 2-up on 4R
export const STRIP_2UP = {
  GAP: 20,          // Gap between strips
  // Each strip: (1200 - 20*2 - 20) / 2 = 570px wide
  WIDTH: Math.floor((PRINT_CANVAS.WIDTH - PRINT_CANVAS.SAFE_MARGIN * 2 - 20) / 2),
  HEIGHT: PRINT_CANVAS.HEIGHT - PRINT_CANVAS.SAFE_MARGIN * 2,  // 1760px tall
} as const;

// CSS Filters for real-time preview
export const CSS_FILTERS: Record<string, string> = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  vintage: 'sepia(50%) contrast(90%) brightness(90%)',
  highContrast: 'contrast(150%) saturate(120%)',
  softGlow: 'brightness(105%) contrast(95%) blur(0.5px)',
  warm: 'sepia(30%) saturate(110%)',
  cool: 'hue-rotate(20deg) saturate(90%)',
  dramatic: 'contrast(130%) brightness(90%) saturate(110%)',
};

// Filter definitions
export const FILTERS: Filter[] = [
  { id: 'none', name: 'Original', cssFilter: CSS_FILTERS.none },
  { id: 'grayscale', name: 'B&W', cssFilter: CSS_FILTERS.grayscale },
  { id: 'vintage', name: 'Vintage', cssFilter: CSS_FILTERS.vintage },
  { id: 'highContrast', name: 'High Contrast', cssFilter: CSS_FILTERS.highContrast },
  { id: 'softGlow', name: 'Soft Glow', cssFilter: CSS_FILTERS.softGlow },
  { id: 'warm', name: 'Warm', cssFilter: CSS_FILTERS.warm },
  { id: 'cool', name: 'Cool', cssFilter: CSS_FILTERS.cool },
  { id: 'dramatic', name: 'Dramatic', cssFilter: CSS_FILTERS.dramatic },
];

// Theme presets
export const THEMES: Theme[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    preset: 'wedding',
    primaryColor: '#d4af37',
    secondaryColor: '#ffffff',
    backgroundColor: '#faf9f6',
    textColor: '#2c2c2c',
    fontFamily: 'Georgia, serif',
    borderStyle: 'double',
    borderWidth: 4,
    borderColor: '#d4af37',
    borderRadius: 0,
    overlayIds: ['wedding-frame'],
  },
  {
    id: 'party',
    name: 'Party',
    preset: 'party',
    primaryColor: '#ff1493',
    secondaryColor: '#00ffff',
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    borderStyle: 'solid',
    borderWidth: 3,
    borderColor: '#ff1493',
    borderRadius: 12,
    overlayIds: ['party-frame'],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    preset: 'corporate',
    primaryColor: '#003366',
    secondaryColor: '#0066cc',
    backgroundColor: '#f5f5f5',
    textColor: '#333333',
    fontFamily: 'Helvetica, Arial, sans-serif',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#003366',
    borderRadius: 4,
    overlayIds: ['corporate-frame'],
  },
  {
    id: 'custom',
    name: 'Custom',
    preset: 'custom',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'system-ui, sans-serif',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 8,
    overlayIds: [],
  },
];

// Overlay definitions
export const OVERLAYS: Overlay[] = [
  {
    id: 'wedding-frame',
    name: 'Wedding Frame',
    type: 'frame',
    src: '/overlays/wedding-frame.png',
  },
  {
    id: 'party-frame',
    name: 'Party Frame',
    type: 'frame',
    src: '/overlays/party-frame.png',
  },
  {
    id: 'corporate-frame',
    name: 'Corporate Frame',
    type: 'frame',
    src: '/overlays/corporate-frame.png',
  },
  {
    id: 'datetime',
    name: 'Date & Time',
    type: 'datetime',
    position: 'bottom',
    style: {
      fontSize: '14px',
      fontFamily: 'inherit',
      color: 'inherit',
    },
  },
  {
    id: 'custom-text',
    name: 'Custom Text',
    type: 'text',
    text: '',
    position: 'bottom',
    style: {
      fontSize: '16px',
      fontFamily: 'inherit',
      color: 'inherit',
    },
  },
];

// WiFi polling defaults
export const WIFI_POLL_INTERVAL = 2000; // ms
export const WIFI_SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.cr2', '.nef', '.arw'];

// Export defaults
export const DEFAULT_EXPORT_QUALITY = 0.92;
export const DEFAULT_EXPORT_DPI = 300;
