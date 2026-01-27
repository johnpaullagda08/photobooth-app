'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types';
import { THEMES } from '@/constants/config';
import { COLOR_PRESETS, FONT_OPTIONS, BORDER_STYLES } from './themes';
import { scaleFadeVariants } from '@/components/animations/variants';

interface ThemeCustomizerProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
  className?: string;
}

export function ThemeCustomizer({ theme, onChange, className }: ThemeCustomizerProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const updateTheme = (updates: Partial<Theme>) => {
    onChange({ ...theme, ...updates });
  };

  const applyColorPreset = (presetName: string) => {
    const preset = COLOR_PRESETS[presetName as keyof typeof COLOR_PRESETS];
    if (preset) {
      updateTheme(preset);
      setActivePreset(presetName);
    }
  };

  return (
    <motion.div
      variants={scaleFadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('flex flex-col gap-6 p-4 bg-zinc-800/50 rounded-xl', className)}
    >
      <h3 className="text-lg font-semibold text-white">Customize Theme</h3>

      {/* Color presets */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400">Color Presets</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLOR_PRESETS).map(([name, colors]) => (
            <button
              key={name}
              onClick={() => applyColorPreset(name)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'border-2 transition-all capitalize',
                activePreset === name
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-700 hover:border-zinc-600'
              )}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors.primaryColor }}
              />
              <span className="text-sm text-zinc-300">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Individual color pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={theme.secondaryColor}
              onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.backgroundColor}
              onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={theme.backgroundColor}
              onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.textColor}
              onChange={(e) => updateTheme({ textColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={theme.textColor}
              onChange={(e) => updateTheme({ textColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Font selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400">Font Family</label>
        <select
          value={theme.fontFamily}
          onChange={(e) => updateTheme({ fontFamily: e.target.value })}
          className="px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Border settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">Border Style</label>
          <select
            value={theme.borderStyle}
            onChange={(e) =>
              updateTheme({ borderStyle: e.target.value as Theme['borderStyle'] })
            }
            className="px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700"
          >
            {BORDER_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">Border Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.borderColor}
              onChange={(e) => updateTheme({ borderColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={theme.borderColor}
              onChange={(e) => updateTheme({ borderColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-zinc-900 text-white rounded-lg border border-zinc-700 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">
            Border Width: {theme.borderWidth}px
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={theme.borderWidth}
            onChange={(e) => updateTheme({ borderWidth: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400">
            Border Radius: {theme.borderRadius}px
          </label>
          <input
            type="range"
            min="0"
            max="24"
            value={theme.borderRadius}
            onChange={(e) => updateTheme({ borderRadius: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400">Preview</label>
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: theme.backgroundColor,
            borderStyle: theme.borderStyle === 'none' ? 'solid' : theme.borderStyle,
            borderWidth: theme.borderWidth,
            borderColor: theme.borderColor,
            borderRadius: theme.borderRadius,
            fontFamily: theme.fontFamily,
          }}
        >
          <p style={{ color: theme.textColor }}>
            Sample text preview
          </p>
          <div className="flex gap-2 mt-2">
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: theme.secondaryColor }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
