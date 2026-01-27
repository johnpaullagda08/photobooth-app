'use client';

import { motion } from 'framer-motion';
import { RotateCcw, Camera } from 'lucide-react';
import { photoSlotVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';
import type { CapturedPhoto } from '@/types';

interface PhotoSlotProps {
  index: number;
  photo: CapturedPhoto | null;
  isActive: boolean;
  filter?: string;
  onRetake?: () => void;
  className?: string;
}

export function PhotoSlot({
  index,
  photo,
  isActive,
  filter = 'none',
  onRetake,
  className,
}: PhotoSlotProps) {
  const isEmpty = !photo;

  return (
    <motion.div
      variants={photoSlotVariants}
      initial="empty"
      animate={photo ? 'filled' : 'empty'}
      whileHover={photo ? 'hover' : undefined}
      className={cn(
        'relative aspect-[4/3] rounded-lg overflow-hidden',
        'border-2 transition-colors',
        isEmpty
          ? 'bg-zinc-800/50 border-dashed border-zinc-600'
          : 'bg-black border-transparent',
        isActive && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900',
        className
      )}
    >
      {photo ? (
        <>
          {/* Photo */}
          <img
            src={photo.dataUrl}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ filter }}
          />

          {/* Retake overlay */}
          {onRetake && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <button
                onClick={onRetake}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-white text-black font-medium',
                  'hover:bg-zinc-200 transition-colors'
                )}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>
            </motion.div>
          )}

          {/* Photo number badge */}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
          <Camera className="w-8 h-8" />
          <span className="text-sm font-medium">Photo {index + 1}</span>
          {isActive && (
            <span className="text-xs text-blue-400">Next</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
