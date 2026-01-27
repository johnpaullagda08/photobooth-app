'use client';

import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { selectorItemVariants, staggerContainerVariants, staggerChildVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';
import { THEMES } from '@/constants/config';
import type { Theme } from '@/types';

interface ThemeSelectorProps {
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
  onCustomize?: () => void;
  className?: string;
}

// Preview component for theme card
function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div
      className="w-full h-16 rounded-md overflow-hidden border"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        borderWidth: theme.borderWidth,
        borderStyle: theme.borderStyle === 'none' ? 'solid' : theme.borderStyle,
        borderRadius: theme.borderRadius,
      }}
    >
      <div className="h-full flex items-center justify-center gap-1 p-2">
        {/* Mini photo strip preview */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-4 h-3 rounded-sm"
            style={{
              backgroundColor: theme.primaryColor,
              opacity: 0.7 + i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeSelector({
  selectedTheme,
  onSelectTheme,
  onCustomize,
  className,
}: ThemeSelectorProps) {
  const presetThemes = THEMES.filter((t) => t.preset !== 'custom');
  const customTheme = THEMES.find((t) => t.preset === 'custom');

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={cn('flex flex-col gap-4', className)}
    >
      <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Theme
      </label>

      {/* Preset themes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {presetThemes.map((theme) => (
          <motion.button
            key={theme.id}
            variants={staggerChildVariants}
            onClick={() => onSelectTheme(theme.id)}
            className={cn(
              'flex flex-col gap-2 p-3 rounded-lg',
              'transition-all border-2 text-left',
              selectedTheme === theme.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
            )}
          >
            <motion.div
              variants={selectorItemVariants}
              animate={selectedTheme === theme.id ? 'selected' : 'unselected'}
            >
              <ThemePreview theme={theme} />
            </motion.div>

            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'font-medium',
                  selectedTheme === theme.id ? 'text-white' : 'text-zinc-300'
                )}
              >
                {theme.name}
              </span>
              {selectedTheme === theme.id && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom theme option */}
      {customTheme && (
        <motion.div variants={staggerChildVariants} className="mt-2">
          <button
            onClick={() => {
              onSelectTheme('custom');
              onCustomize?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-lg',
              'transition-all border-2 text-left',
              selectedTheme === 'custom'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 border-dashed hover:border-zinc-500 hover:bg-zinc-800/50'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                selectedTheme === 'custom' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'
              )}
            >
              <Palette className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-medium',
                    selectedTheme === 'custom' ? 'text-white' : 'text-zinc-300'
                  )}
                >
                  Custom Theme
                </span>
                {selectedTheme === 'custom' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <span className="text-xs text-zinc-500">
                Create your own colors and styles
              </span>
            </div>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
