'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CapturedPhoto, PhotoCount, Theme, PrintSize, PrinterConfig } from '@/types';
import type { BoxConfig } from '@/lib/events/types';
import { composeForPrint } from '@/lib/printing/formats';
import { print, getDefaultPrinter } from '@/lib/printing/thermal';
import { fadeVariants } from '@/components/animations/variants';
import { PRINT_CANVAS } from '@/constants/config';

interface PrintButtonProps {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  printSize: PrintSize;
  printer?: PrinterConfig;
  className?: string;
  /** Box configurations for custom layouts */
  boxes?: BoxConfig[];
  /** Background image */
  backgroundImage?: string | null;
  /** Frame overlay */
  frameTemplate?: string | null;
}

type PrintState = 'idle' | 'preparing' | 'printing' | 'complete' | 'error';

/**
 * PrintButton - Triggers print composition and printing
 *
 * Output specifications:
 * - Always outputs 4R canvas (1200 x 1800 px at 300 DPI)
 * - Strip mode (2x6): 2 identical strips side-by-side
 * - 4R mode (4x6): Single layout fills the canvas
 */
export function PrintButton({
  photos,
  photoCount,
  filterId,
  theme,
  printSize,
  printer,
  className,
  boxes,
  backgroundImage,
  frameTemplate,
}: PrintButtonProps) {
  const [state, setState] = useState<PrintState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    if (photos.length === 0) return;

    setState('preparing');
    setError(null);

    try {
      // Compose the print canvas (always 4R output)
      const canvas = await composeForPrint({
        photos,
        photoCount,
        filterId,
        theme,
        printSize,
        duplicateStrip: true, // Always 2 strips for strip mode
        boxes,
        backgroundImage,
        frameTemplate,
      });

      // Export as high-quality JPEG
      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      setState('printing');

      // Send to printer
      const job = await print(imageData, printer || getDefaultPrinter());

      if (job.status === 'complete') {
        setState('complete');
        setTimeout(() => setState('idle'), 3000);
      } else if (job.status === 'error') {
        throw new Error(job.error || 'Print failed');
      }
    } catch (err) {
      setState('error');
      setError((err as Error).message);
      setTimeout(() => setState('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'preparing':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Preparing...</span>
          </>
        );
      case 'printing':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Printing...</span>
          </>
        );
      case 'complete':
        return (
          <>
            <Check className="w-5 h-5" />
            <span>Printed!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <Printer className="w-5 h-5" />
            <span>Print</span>
          </>
        );
    }
  };

  const getButtonStyle = () => {
    switch (state) {
      case 'complete':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-purple-600 hover:bg-purple-700';
    }
  };

  const isStrip = printSize === '2x6';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <motion.button
        onClick={handlePrint}
        disabled={state !== 'idle' && state !== 'error' || photos.length === 0}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold',
          'text-white transition-colors',
          getButtonStyle(),
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center gap-2"
          >
            {getButtonContent()}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Error message */}
      <AnimatePresence>
        {error && state === 'error' && (
          <motion.div
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-xs text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print info */}
      <div className="text-xs text-zinc-500 text-center">
        <p>
          {isStrip ? '2× strips on 4×6"' : '4×6" (4R) photo'}
        </p>
        <p className="text-zinc-600">
          {PRINT_CANVAS.WIDTH}×{PRINT_CANVAS.HEIGHT}px @ {PRINT_CANVAS.DPI} DPI
        </p>
      </div>
    </div>
  );
}
