'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PrintSize } from '@/types';
import { PRINT_FORMATS } from '@/constants/config';
import { selectorItemVariants } from '@/components/animations/variants';
import { Ruler } from 'lucide-react';

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
        Print Size
      </label>

      <div className="grid grid-cols-2 gap-3">
        {SIZES.map((size) => {
          const format = PRINT_FORMATS[size];
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
                  'rounded border-2',
                  selectedSize === size
                    ? 'border-blue-400 bg-blue-400/20'
                    : 'border-zinc-600 bg-zinc-800'
                )}
                style={{
                  width: size === '2x6' ? '24px' : '48px',
                  height: '72px',
                }}
              >
                {/* Photo slots */}
                <div className="flex flex-col gap-0.5 p-0.5 h-full">
                  {size === '2x6' ? (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 bg-zinc-600 rounded-sm"
                          style={{ opacity: 0.5 + i * 0.1 }}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="flex gap-0.5 h-full">
                      <div className="flex-1 flex flex-col gap-0.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex-1 bg-zinc-600 rounded-sm"
                            style={{ opacity: 0.5 + i * 0.1 }}
                          />
                        ))}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex-1 bg-zinc-600 rounded-sm"
                            style={{ opacity: 0.5 + i * 0.1 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="text-center">
                <div
                  className={cn(
                    'font-semibold text-lg',
                    selectedSize === size ? 'text-white' : 'text-zinc-300'
                  )}
                >
                  {format.label}
                </div>
                <div className="text-xs text-zinc-500">
                  {format.width}×{format.height}px @ {format.dpi}DPI
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 text-center">
        {selectedSize === '2x6'
          ? 'Classic photo strip format - single strip'
          : 'Photo paper format - two strips side by side'}
      </p>
    </div>
  );
}
