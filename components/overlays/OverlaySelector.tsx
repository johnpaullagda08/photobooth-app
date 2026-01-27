'use client';

import { motion } from 'framer-motion';
import { Check, Image, Type, Clock } from 'lucide-react';
import { selectorItemVariants, staggerContainerVariants, staggerChildVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';
import { OVERLAYS } from '@/constants/config';
import type { Overlay } from '@/types';

interface OverlaySelectorProps {
  selectedOverlays: string[];
  onToggleOverlay: (overlayId: string) => void;
  customText?: string;
  onCustomTextChange?: (text: string) => void;
  className?: string;
}

const getOverlayIcon = (overlay: Overlay) => {
  switch (overlay.type) {
    case 'frame':
    case 'logo':
      return <Image className="w-5 h-5" />;
    case 'datetime':
      return <Clock className="w-5 h-5" />;
    case 'text':
      return <Type className="w-5 h-5" />;
    default:
      return <Image className="w-5 h-5" />;
  }
};

export function OverlaySelector({
  selectedOverlays,
  onToggleOverlay,
  customText,
  onCustomTextChange,
  className,
}: OverlaySelectorProps) {
  const isSelected = (id: string) => selectedOverlays.includes(id);

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={cn('flex flex-col gap-4', className)}
    >
      <label className="text-sm font-medium text-zinc-400">Overlays</label>

      {/* Overlay options */}
      <div className="grid grid-cols-2 gap-3">
        {OVERLAYS.map((overlay) => (
          <motion.button
            key={overlay.id}
            variants={staggerChildVariants}
            onClick={() => onToggleOverlay(overlay.id)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              'transition-all border-2 text-left',
              isSelected(overlay.id)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
            )}
          >
            {/* Icon */}
            <motion.div
              variants={selectorItemVariants}
              animate={isSelected(overlay.id) ? 'selected' : 'unselected'}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isSelected(overlay.id) ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'
              )}
            >
              {getOverlayIcon(overlay)}
            </motion.div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-medium truncate',
                    isSelected(overlay.id) ? 'text-white' : 'text-zinc-300'
                  )}
                >
                  {overlay.name}
                </span>
                {isSelected(overlay.id) && (
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-zinc-500 capitalize">{overlay.type}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom text input */}
      {selectedOverlays.includes('custom-text') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-2"
        >
          <label
            htmlFor="custom-text"
            className="text-sm font-medium text-zinc-400"
          >
            Custom Text
          </label>
          <input
            id="custom-text"
            type="text"
            value={customText || ''}
            onChange={(e) => onCustomTextChange?.(e.target.value)}
            placeholder="Enter your custom text..."
            maxLength={50}
            className={cn(
              'w-full px-4 py-3 bg-zinc-800 text-white rounded-lg',
              'border border-zinc-700 focus:border-blue-500 focus:outline-none',
              'placeholder:text-zinc-500'
            )}
          />
          <span className="text-xs text-zinc-500 text-right">
            {(customText?.length || 0)} / 50
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
