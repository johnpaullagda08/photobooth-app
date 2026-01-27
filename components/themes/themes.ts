import type { Theme, ThemePreset } from '@/types';
import { THEMES } from '@/constants/config';

// Re-export theme definitions
export { THEMES };

// Get theme by ID
export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

// Get themes by preset type
export function getThemesByPreset(preset: ThemePreset): Theme[] {
  return THEMES.filter((t) => t.preset === preset);
}

// Create a custom theme based on user preferences
export function createCustomTheme(overrides: Partial<Theme>): Theme {
  const baseCustomTheme = THEMES.find((t) => t.id === 'custom')!;
  return {
    ...baseCustomTheme,
    ...overrides,
    id: overrides.id || `custom-${Date.now()}`,
    preset: 'custom' as ThemePreset,
  };
}

// Theme color presets for the customizer
export const COLOR_PRESETS = {
  classic: {
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
  },
  elegant: {
    primaryColor: '#d4af37',
    secondaryColor: '#ffffff',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    borderColor: '#d4af37',
  },
  modern: {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    borderColor: '#6366f1',
  },
  playful: {
    primaryColor: '#ec4899',
    secondaryColor: '#f97316',
    backgroundColor: '#fef3c7',
    textColor: '#1f2937',
    borderColor: '#ec4899',
  },
  natural: {
    primaryColor: '#16a34a',
    secondaryColor: '#84cc16',
    backgroundColor: '#f0fdf4',
    textColor: '#14532d',
    borderColor: '#16a34a',
  },
};

// Font options for the customizer
export const FONT_OPTIONS = [
  { value: 'system-ui, sans-serif', label: 'System Default' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans' },
  { value: 'Impact, sans-serif', label: 'Impact' },
];

// Border style options
export const BORDER_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'double', label: 'Double' },
  { value: 'dashed', label: 'Dashed' },
];

// Apply theme to CSS variables
export function applyThemeToCSSVariables(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.primaryColor);
  root.style.setProperty('--theme-secondary', theme.secondaryColor);
  root.style.setProperty('--theme-background', theme.backgroundColor);
  root.style.setProperty('--theme-text', theme.textColor);
  root.style.setProperty('--theme-border', theme.borderColor);
  root.style.setProperty('--theme-font', theme.fontFamily);
}
