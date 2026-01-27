'use client';

import { motion } from 'framer-motion';
import { PhotoSlot } from './PhotoSlot';
import { photoStripVariants, staggerChildVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';
import type { CapturedPhoto, PhotoCount } from '@/types';

interface PhotoStripProps {
  photos: (CapturedPhoto | null)[];
  photoCount: PhotoCount;
  currentIndex: number;
  filter?: string;
  onRetake?: (index: number) => void;
  className?: string;
}

export function PhotoStrip({
  photos,
  photoCount,
  currentIndex,
  filter = 'none',
  onRetake,
  className,
}: PhotoStripProps) {
  // Ensure we always have the right number of slots
  const slots = Array.from({ length: photoCount }, (_, i) => photos[i] || null);

  return (
    <motion.div
      variants={photoStripVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col gap-3 p-4 bg-zinc-900 rounded-xl',
        className
      )}
    >
      {/* Strip header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400 font-medium">Photo Strip</span>
        <span className="text-zinc-500">
          {photos.filter(Boolean).length} / {photoCount}
        </span>
      </div>

      {/* Photo slots */}
      <div className="flex flex-col gap-2">
        {slots.map((photo, index) => (
          <motion.div key={index} variants={staggerChildVariants}>
            <PhotoSlot
              index={index}
              photo={photo}
              isActive={index === currentIndex}
              filter={filter}
              onRetake={photo && onRetake ? () => onRetake(index) : undefined}
            />
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${(photos.filter(Boolean).length / photoCount) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
