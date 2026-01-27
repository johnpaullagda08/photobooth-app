'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PhotoCount, CountdownDuration } from '@/types';
import {
  PHOTO_COUNT_OPTIONS,
  COUNTDOWN_OPTIONS,
} from '@/constants/config';
import { selectorItemVariants } from '@/components/animations/variants';
import { Grid2X2, Grid3X3, Timer } from 'lucide-react';

interface CaptureModeProps {
  photoCount: PhotoCount;
  countdownDuration: CountdownDuration;
  onPhotoCountChange: (count: PhotoCount) => void;
  onCountdownChange: (duration: CountdownDuration) => void;
  className?: string;
}

export function CaptureMode({
  photoCount,
  countdownDuration,
  onPhotoCountChange,
  onCountdownChange,
  className,
}: CaptureModeProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Photo Count Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Grid2X2 className="w-4 h-4" />
          Photos per strip
        </label>
        <div className="flex gap-2">
          {PHOTO_COUNT_OPTIONS.map((count) => (
            <motion.button
              key={count}
              onClick={() => onPhotoCountChange(count)}
              variants={selectorItemVariants}
              animate={photoCount === count ? 'selected' : 'unselected'}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg text-center font-semibold',
                'transition-colors border-2',
                photoCount === count
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'
              )}
            >
              <span className="text-2xl">{count}</span>
              <span className="block text-xs mt-1 opacity-70">photos</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Countdown Duration Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Timer className="w-4 h-4" />
          Countdown duration
        </label>
        <div className="flex gap-2">
          {COUNTDOWN_OPTIONS.map((duration) => (
            <motion.button
              key={duration}
              onClick={() => onCountdownChange(duration)}
              variants={selectorItemVariants}
              animate={countdownDuration === duration ? 'selected' : 'unselected'}
              className={cn(
                'flex-1 py-3 px-2 rounded-lg text-center font-semibold',
                'transition-colors border-2',
                countdownDuration === duration
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'
              )}
            >
              <span className="text-xl">{duration}s</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-zinc-800/50 rounded-lg">
        <p className="text-sm text-zinc-400 text-center">
          Take <span className="text-white font-semibold">{photoCount} photos</span> with a{' '}
          <span className="text-white font-semibold">{countdownDuration} second</span> countdown
          between each
        </p>
      </div>
    </div>
  );
}
