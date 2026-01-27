// Event and related types for the photobooth app

export interface DraggableElement {
  id: string;
  type: 'text' | 'logo' | 'image' | 'button' | 'shape';
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  rotation: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  properties: ElementProperties;
}

export interface ElementProperties {
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;

  // Image/Logo properties
  src?: string; // base64 or URL
  objectFit?: 'contain' | 'cover' | 'fill';
  borderRadius?: number;
  opacity?: number;

  // Button properties
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: number;

  // Shape properties
  shapeType?: 'rectangle' | 'circle' | 'line' | 'triangle';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface OverlayConfig {
  id: string;
  type: 'frame' | 'corner' | 'logo' | 'watermark' | 'datetime' | 'text';
  src?: string; // for images
  text?: string; // for text overlays
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full';
  x?: number; // custom position percentage
  y?: number;
  width?: number;
  height?: number;
  opacity: number;
  visible: boolean;
  style?: {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
  };
}

export interface BoxConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaunchPageConfig {
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOpacity: number;
  elements: DraggableElement[];
}

export interface CameraConfig {
  deviceId: string | null;
  source: 'webcam' | 'hdmi' | 'usb-tether' | 'wifi';
  isMirrored: boolean;
}

export interface CountdownConfig {
  enabled: boolean;
  duration: 3 | 5 | 8 | 10;
  beforeCapture: boolean;
  beforePrint: boolean;
  showAnimation: boolean;
  soundEnabled: boolean;
}

export interface PrintLayoutConfig {
  format: '2x6-strip' | '4r-single' | '4r-grid-2x2';
  orientation: 'portrait' | 'landscape';
  photoCount: 1 | 3 | 4;
  layoutPreset: 'grid' | 'custom';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  spacing: number;
  boxes: BoxConfig[];
  frameTemplate: string | null;
  overlays: OverlayConfig[];
}

export interface PrintingConfig {
  paperSize: '4x6' | '5x7' | '6x8';
  printOutput: 'single' | 'double-strip'; // single = 1 strip per page, double-strip = 2 strips side by side
  copies: number;
  autoPrint: boolean;
  quality: 'draft' | 'normal' | 'high';
  // Pro features
  showCutMarks: boolean;
  colorCorrection: {
    enabled: boolean;
    brightness: number; // -100 to 100
    contrast: number; // -100 to 100
    saturation: number; // -100 to 100
  };
  printerProfile: string | null; // ICC profile name
}

export interface PrinterConfig {
  selectedPrinterId: string | null;
  printerName: string | null;
  isConnected: boolean;
}

export interface PhotoboothEvent {
  id: string;
  name: string;
  date: string; // ISO date string
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

// Default configurations
export const DEFAULT_LAUNCH_PAGE: LaunchPageConfig = {
  backgroundColor: '#1a1a2e',
  backgroundImage: null,
  backgroundOpacity: 100,
  elements: [
    {
      id: 'title',
      type: 'text',
      x: 50,
      y: 30,
      width: 80,
      height: 15,
      rotation: 0,
      visible: true,
      locked: false,
      zIndex: 1,
      properties: {
        text: 'Welcome to Our Event',
        fontSize: 48,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#ffffff',
      },
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 50,
      y: 45,
      width: 60,
      height: 10,
      rotation: 0,
      visible: true,
      locked: false,
      zIndex: 2,
      properties: {
        text: 'Tap the button to start',
        fontSize: 24,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#cccccc',
      },
    },
    {
      id: 'start-button',
      type: 'button',
      x: 50,
      y: 70,
      width: 30,
      height: 12,
      rotation: 0,
      visible: true,
      locked: false,
      zIndex: 3,
      properties: {
        buttonText: 'Start Photo Session',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: 12,
      },
    },
  ],
};

export const DEFAULT_CAMERA: CameraConfig = {
  deviceId: null,
  source: 'webcam',
  isMirrored: true,
};

export const DEFAULT_COUNTDOWN: CountdownConfig = {
  enabled: true,
  duration: 3,
  beforeCapture: true,
  beforePrint: false,
  showAnimation: true,
  soundEnabled: false,
};

export const DEFAULT_PRINT_LAYOUT: PrintLayoutConfig = {
  format: '2x6-strip',
  orientation: 'portrait',
  photoCount: 4,
  layoutPreset: 'grid',
  margins: { top: 5, right: 5, bottom: 5, left: 5 },
  spacing: 5,
  boxes: [
    { id: 'photo-1', label: 'Photo 1', x: 5, y: 5, width: 90, height: 22 },
    { id: 'photo-2', label: 'Photo 2', x: 5, y: 29, width: 90, height: 22 },
    { id: 'photo-3', label: 'Photo 3', x: 5, y: 53, width: 90, height: 22 },
    { id: 'photo-4', label: 'Photo 4', x: 5, y: 77, width: 90, height: 22 },
  ],
  frameTemplate: null,
  overlays: [],
};

// Layout preset configurations for print formats
export const LAYOUT_PRESETS: Record<string, { grid: (count: number) => BoxConfig[] }> = {
  '2x6-strip': {
    grid: (count: number) => {
      const boxHeight = Math.floor(85 / count);
      const spacing = Math.floor((100 - boxHeight * count - 10) / (count + 1));
      return Array.from({ length: count }, (_, i) => ({
        id: `photo-${i + 1}`,
        label: `Photo ${i + 1}`,
        x: 5,
        y: spacing + i * (boxHeight + spacing),
        width: 90,
        height: boxHeight,
      }));
    },
  },
  '4r-single': {
    grid: () => [{
      id: 'photo-1',
      label: 'Photo 1',
      x: 5,
      y: 5,
      width: 90,
      height: 90,
    }],
  },
  '4r-grid-2x2': {
    grid: () => {
      const margin = 5;
      const spacing = 3;
      const boxWidth = (100 - margin * 2 - spacing) / 2;
      const boxHeight = (100 - margin * 2 - spacing) / 2;
      return [
        { id: 'photo-1', label: 'Photo 1', x: margin, y: margin, width: boxWidth, height: boxHeight },
        { id: 'photo-2', label: 'Photo 2', x: margin + boxWidth + spacing, y: margin, width: boxWidth, height: boxHeight },
        { id: 'photo-3', label: 'Photo 3', x: margin, y: margin + boxHeight + spacing, width: boxWidth, height: boxHeight },
        { id: 'photo-4', label: 'Photo 4', x: margin + boxWidth + spacing, y: margin + boxHeight + spacing, width: boxWidth, height: boxHeight },
      ];
    },
  },
};

export const DEFAULT_PRINTING: PrintingConfig = {
  paperSize: '4x6',
  printOutput: 'double-strip', // 2 strips side by side on 4x6 paper
  copies: 1,
  autoPrint: false,
  quality: 'high',
  showCutMarks: true,
  colorCorrection: {
    enabled: false,
    brightness: 0,
    contrast: 0,
    saturation: 0,
  },
  printerProfile: null,
};

export const DEFAULT_PRINTER: PrinterConfig = {
  selectedPrinterId: null,
  printerName: null,
  isConnected: false,
};

// Event templates
export const EVENT_TEMPLATES: Record<string, Partial<PhotoboothEvent>> = {
  wedding: {
    template: 'wedding',
    launchPage: {
      ...DEFAULT_LAUNCH_PAGE,
      backgroundColor: '#f8f5f2',
      elements: [
        {
          id: 'title',
          type: 'text',
          x: 50,
          y: 25,
          width: 80,
          height: 15,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 1,
          properties: {
            text: 'John & Jane',
            fontSize: 56,
            fontFamily: 'Playfair Display',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#8b7355',
          },
        },
        {
          id: 'subtitle',
          type: 'text',
          x: 50,
          y: 40,
          width: 60,
          height: 10,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 2,
          properties: {
            text: 'Our Wedding Day',
            fontSize: 28,
            fontFamily: 'Playfair Display',
            fontWeight: 'normal',
            textAlign: 'center',
            color: '#a08060',
          },
        },
        {
          id: 'date-text',
          type: 'text',
          x: 50,
          y: 52,
          width: 40,
          height: 8,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 3,
          properties: {
            text: 'January 26, 2026',
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            textAlign: 'center',
            color: '#888888',
          },
        },
        {
          id: 'start-button',
          type: 'button',
          x: 50,
          y: 75,
          width: 35,
          height: 12,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 4,
          properties: {
            buttonText: 'Capture Memories',
            buttonColor: '#8b7355',
            buttonTextColor: '#ffffff',
            buttonBorderRadius: 30,
          },
        },
      ],
    },
  },
  birthday: {
    template: 'birthday',
    launchPage: {
      ...DEFAULT_LAUNCH_PAGE,
      backgroundColor: '#fef3c7',
      elements: [
        {
          id: 'title',
          type: 'text',
          x: 50,
          y: 25,
          width: 80,
          height: 15,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 1,
          properties: {
            text: '🎉 Happy Birthday! 🎂',
            fontSize: 48,
            fontFamily: 'Comic Sans MS',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ec4899',
          },
        },
        {
          id: 'subtitle',
          type: 'text',
          x: 50,
          y: 42,
          width: 60,
          height: 10,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 2,
          properties: {
            text: "Let's celebrate!",
            fontSize: 28,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            textAlign: 'center',
            color: '#f97316',
          },
        },
        {
          id: 'start-button',
          type: 'button',
          x: 50,
          y: 70,
          width: 35,
          height: 14,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 3,
          properties: {
            buttonText: '📸 Take Photos!',
            buttonColor: '#ec4899',
            buttonTextColor: '#ffffff',
            buttonBorderRadius: 20,
          },
        },
      ],
    },
  },
  corporate: {
    template: 'corporate',
    launchPage: {
      ...DEFAULT_LAUNCH_PAGE,
      backgroundColor: '#0f172a',
      elements: [
        {
          id: 'logo',
          type: 'logo',
          x: 50,
          y: 20,
          width: 20,
          height: 15,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 1,
          properties: {
            src: '',
            objectFit: 'contain',
          },
        },
        {
          id: 'title',
          type: 'text',
          x: 50,
          y: 40,
          width: 80,
          height: 12,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 2,
          properties: {
            text: 'Company Event 2026',
            fontSize: 42,
            fontFamily: 'Inter',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ffffff',
          },
        },
        {
          id: 'subtitle',
          type: 'text',
          x: 50,
          y: 52,
          width: 60,
          height: 8,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 3,
          properties: {
            text: 'Professional Photo Experience',
            fontSize: 20,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            textAlign: 'center',
            color: '#94a3b8',
          },
        },
        {
          id: 'start-button',
          type: 'button',
          x: 50,
          y: 72,
          width: 28,
          height: 11,
          rotation: 0,
          visible: true,
          locked: false,
          zIndex: 4,
          properties: {
            buttonText: 'Begin Session',
            buttonColor: '#3b82f6',
            buttonTextColor: '#ffffff',
            buttonBorderRadius: 8,
          },
        },
      ],
    },
  },
};

export function createDefaultEvent(template: 'wedding' | 'birthday' | 'corporate' = 'wedding'): PhotoboothEvent {
  const now = Date.now();
  const templateConfig = EVENT_TEMPLATES[template] || {};

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `event-${now}`,
    name: `New ${template.charAt(0).toUpperCase() + template.slice(1)} Event`,
    date: new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    template,
    launchPage: templateConfig.launchPage || DEFAULT_LAUNCH_PAGE,
    camera: DEFAULT_CAMERA,
    countdown: DEFAULT_COUNTDOWN,
    printLayout: DEFAULT_PRINT_LAYOUT,
    printing: DEFAULT_PRINTING,
    printer: DEFAULT_PRINTER,
  };
}
