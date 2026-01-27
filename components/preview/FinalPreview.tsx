'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CapturedPhoto, PhotoCount, Theme } from '@/types';
import { composePhotoStrip } from '@/lib/canvas/composer';
import { screenVariants, fadeVariants } from '@/components/animations/variants';
import { Loader2 } from 'lucide-react';

interface FinalPreviewProps {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  overlayIds: string[];
  customTexts?: Record<string, string>;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function FinalPreview({
  photos,
  photoCount,
  filterId,
  theme,
  overlayIds,
  customTexts,
  className,
  onCanvasReady,
}: FinalPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const renderPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const canvas = await composePhotoStrip({
          photos,
          photoCount,
          filterId,
          theme,
          overlayIds,
          customTexts,
          includeDatetime: overlayIds.includes('datetime'),
        });

        if (!mounted) return;

        canvasRef.current = canvas;
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);
        onCanvasReady?.(canvas);
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message || 'Failed to render preview');
        console.error('Preview render error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    renderPreview();

    return () => {
      mounted = false;
    };
  }, [photos, photoCount, filterId, theme, overlayIds, customTexts, onCanvasReady]);

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('flex flex-col items-center gap-4', className)}
    >
      <div className="relative bg-zinc-900 rounded-xl p-4 shadow-2xl">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-xl z-10"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-sm text-zinc-400">Generating preview...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {previewUrl && (
          <motion.img
            src={previewUrl}
            alt="Photo strip preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: '70vh' }}
          />
        )}
      </div>

      {/* Photo count indicator */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span>{photos.length} photos</span>
        <span>•</span>
        <span>{theme.name} theme</span>
        {filterId !== 'none' && (
          <>
            <span>•</span>
            <span className="capitalize">{filterId} filter</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
