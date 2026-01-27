'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Loader2, ChevronDown, FileImage, Share2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CapturedPhoto, PhotoCount, Theme, ExportOptions } from '@/types';
import { downloadPhotoStrip, copyToClipboard, sharePhotoStrip, formatFileSize, getExportSize } from '@/lib/canvas/export';
import { fadeVariants, scaleFadeVariants } from '@/components/animations/variants';

interface DownloadButtonProps {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  overlayIds: string[];
  customTexts?: Record<string, string>;
  className?: string;
}

type DownloadFormat = 'png' | 'jpeg';

export function DownloadButton({
  photos,
  photoCount,
  filterId,
  theme,
  overlayIds,
  customTexts,
  className,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [format, setFormat] = useState<DownloadFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

  const params = { photos, photoCount, filterId, theme, overlayIds, customTexts };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadComplete(false);

    try {
      await downloadPhotoStrip(params, { format, quality, dpi: 300 });
      setDownloadComplete(true);
      setTimeout(() => setDownloadComplete(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    setIsDownloading(true);
    try {
      const success = await copyToClipboard(params);
      if (success) {
        setDownloadComplete(true);
        setTimeout(() => setDownloadComplete(false), 2000);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsDownloading(true);
    try {
      await sharePhotoStrip(params);
    } finally {
      setIsDownloading(false);
    }
  };

  const updateEstimatedSize = async () => {
    try {
      const size = await getExportSize(params, format, quality);
      setEstimatedSize(size);
    } catch {
      setEstimatedSize(null);
    }
  };

  // Update size estimate when options change
  const handleFormatChange = (newFormat: DownloadFormat) => {
    setFormat(newFormat);
    updateEstimatedSize();
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    updateEstimatedSize();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main button group */}
      <div className="flex items-center gap-1">
        {/* Download button */}
        <motion.button
          onClick={handleDownload}
          disabled={isDownloading || photos.length === 0}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-l-lg font-semibold',
            'bg-blue-600 text-white',
            'hover:bg-blue-700 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <AnimatePresence mode="wait">
            {isDownloading ? (
              <motion.span key="loading" {...fadeVariants}>
                <Loader2 className="w-5 h-5 animate-spin" />
              </motion.span>
            ) : downloadComplete ? (
              <motion.span key="complete" {...fadeVariants}>
                <Check className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span key="download" {...fadeVariants}>
                <Download className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
          <span>{downloadComplete ? 'Downloaded!' : 'Download'}</span>
        </motion.button>

        {/* Options dropdown trigger */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={cn(
            'flex items-center justify-center w-10 h-12 rounded-r-lg',
            'bg-blue-600 text-white border-l border-blue-500',
            'hover:bg-blue-700 transition-colors'
          )}
        >
          <ChevronDown
            className={cn(
              'w-5 h-5 transition-transform',
              showOptions && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Options dropdown */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            variants={scaleFadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'absolute top-full left-0 right-0 mt-2',
              'bg-zinc-800 rounded-lg shadow-xl border border-zinc-700',
              'p-4 z-50'
            )}
          >
            {/* Format selection */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-medium text-zinc-400">Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFormatChange('png')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg',
                    'border-2 transition-colors',
                    format === 'png'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  <FileImage className="w-4 h-4" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => handleFormatChange('jpeg')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg',
                    'border-2 transition-colors',
                    format === 'jpeg'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  <FileImage className="w-4 h-4" />
                  <span>JPEG</span>
                </button>
              </div>
            </div>

            {/* Quality slider (for JPEG) */}
            {format === 'jpeg' && (
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium text-zinc-400">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            )}

            {/* Size estimate */}
            {estimatedSize && (
              <p className="text-xs text-zinc-500 mb-4">
                Estimated size: {formatFileSize(estimatedSize)}
              </p>
            )}

            {/* Additional actions */}
            <div className="flex gap-2 pt-3 border-t border-zinc-700">
              <button
                onClick={handleCopy}
                disabled={isDownloading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg',
                  'bg-zinc-700 text-white hover:bg-zinc-600 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleShare}
                disabled={isDownloading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg',
                  'bg-zinc-700 text-white hover:bg-zinc-600 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
