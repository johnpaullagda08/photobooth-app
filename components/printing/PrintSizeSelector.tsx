'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PrintSize } from '@/types';
import { PRINT_FORMATS, PRINT_CANVAS } from '@/constants/config';
import { selectorItemVariants } from '@/components/animations/variants';
import { Ruler, Columns, Image } from 'lucide-react';

interface PrintSizeSelectorProps {
  selectedSize: PrintSize;
  onSelectSize: (size: PrintSize) => void;
  className?: string;
}

const SIZES: PrintSize[] = ['2x6', '4x6'];

export function PrintSizeSelector({
  selectedSize,
  onSelectSize,
  className,
}: PrintSizeSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <Ruler className="w-4 h-4" />
        Print Layout
      </label>

      <div className="grid grid-cols-2 gap-3">
        {SIZES.map((size) => {
          const format = PRINT_FORMATS[size];
          const isStrip = size === '2x6';
          const Icon = isStrip ? Columns : Image;

          return (
            <motion.button
              key={size}
              variants={selectorItemVariants}
              animate={selectedSize === size ? 'selected' : 'unselected'}
              onClick={() => onSelectSize(size)}
              className={cn(
                'flex flex-col items-center gap-3 p-4 rounded-lg',
                'border-2 transition-all',
                selectedSize === size
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
              )}
            >
              {/* Visual representation */}
              <div
                className={cn(
                  'rounded border-2 relative',
                  selectedSize === size
                    ? 'border-blue-400 bg-blue-400/20'
                    : 'border-zinc-600 bg-zinc-800'
                )}
                style={{
                  width: '48px',
                  height: '72px',
                }}
              >
                {isStrip ? (
                  // 2 strips side by side
                  <div className="flex gap-0.5 p-0.5 h-full">
                    {/* Left strip */}
                    <div className="flex-1 flex flex-col gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={`l-${i}`}
                          className="flex-1 bg-zinc-600 rounded-sm"
                          style={{ opacity: 0.5 + i * 0.1 }}
                        />
                      ))}
                    </div>
                    {/* Right strip (identical) */}
                    <div className="flex-1 flex flex-col gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={`r-${i}`}
                          className="flex-1 bg-zinc-600 rounded-sm"
                          style={{ opacity: 0.5 + i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  // 4R layout (2x2 grid)
                  <div className="grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 h-full">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-zinc-600 rounded-sm"
                        style={{ opacity: 0.5 + i * 0.1 }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <div
                  className={cn(
                    'font-semibold text-base flex items-center gap-1.5 justify-center',
                    selectedSize === size ? 'text-white' : 'text-zinc-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {isStrip ? '2× Strip' : '4R Photo'}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {PRINT_CANVAS.WIDTH}×{PRINT_CANVAS.HEIGHT}px
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Description */}
      <div className="text-xs text-zinc-500 text-center p-2 bg-zinc-800/50 rounded-lg">
        {selectedSize === '2x6' ? (
          <span>
            <strong>2× Strip:</strong> Two identical 2×6 strips side-by-side on 4×6 paper
          </span>
        ) : (
          <span>
            <strong>4R Photo:</strong> Single layout fills the 4×6 paper
          </span>
        )}
      </div>

      {/* Technical specs */}
      <div className="flex justify-center gap-4 text-xs text-zinc-600">
        <span>Output: 4×6 inches</span>
        <span>•</span>
        <span>{PRINT_CANVAS.DPI} DPI</span>
        <span>•</span>
        <span>{PRINT_CANVAS.WIDTH}×{PRINT_CANVAS.HEIGHT}px</span>
      </div>
    </div>
  );
}
