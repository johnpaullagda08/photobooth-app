'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PhotoboothEvent } from '@/lib/events/types';
import { Download, Printer, RotateCcw, Home, Loader2 } from 'lucide-react';
import { saveLastOutput } from '@/lib/photos/lastOutput';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

interface ResultScreenProps {
  event: PhotoboothEvent;
  photos: CapturedPhoto[];
  onNewSession: () => void;
  onRetake: () => void;
}

export function ResultScreen({ event, photos, onNewSession, onRetake }: ResultScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Helper to load an image with proper error handling
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image`));
      img.src = src;
      // Handle already cached/loaded images (data URLs load synchronously)
      if (img.complete && img.naturalWidth > 0) {
        resolve(img);
      }
    });
  };

  // Compose the final image
  useEffect(() => {
    const composeImage = async () => {
      const canvas = canvasRef.current;
      if (!canvas || photos.length === 0) return;

      const { orientation, boxes } = event.printLayout;

      // Set canvas dimensions based on 2x6 strip format (300 DPI)
      // 2 inches × 300 DPI = 600 pixels, 6 inches × 300 DPI = 1800 pixels
      const width = orientation === 'portrait' ? 600 : 1800;
      const height = orientation === 'portrait' ? 1800 : 600;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw photos in boxes FIRST
      const photosToRender = Math.min(photos.length, boxes.length);
      console.log(`Rendering ${photosToRender} photos into ${boxes.length} boxes`);

      for (let i = 0; i < photosToRender; i++) {
        const box = boxes[i];
        const photo = photos[i];

        if (!photo?.dataUrl) {
          console.warn(`Photo ${i} has no dataUrl`);
          continue;
        }

        try {
          const img = await loadImage(photo.dataUrl);

          const x = (box.x / 100) * width;
          const y = (box.y / 100) * height;
          const w = (box.width / 100) * width;
          const h = (box.height / 100) * height;

          // Draw photo with cover fit (fills the box, crops excess)
          const imgRatio = img.width / img.height;
          const boxRatio = w / h;

          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgRatio > boxRatio) {
            // Image is wider than box - crop sides
            sw = img.height * boxRatio;
            sx = (img.width - sw) / 2;
          } else {
            // Image is taller than box - crop top/bottom
            sh = img.width / boxRatio;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
          console.log(`Drew photo ${i + 1} at (${x}, ${y}) size ${w}x${h}, img: ${img.width}x${img.height}`);
        } catch (err) {
          console.error(`Failed to load photo ${i}:`, err);
        }
      }

      // Draw frame template LAST (overlay on top of photos)
      if (event.printLayout.frameTemplate) {
        try {
          const frameImg = await loadImage(event.printLayout.frameTemplate);
          ctx.drawImage(frameImg, 0, 0, width, height);
        } catch (err) {
          console.error('Failed to load frame template:', err);
        }
      }

      const finalImage = canvas.toDataURL('image/jpeg', 0.95);
      setCompositeImage(finalImage);

      // Save to last output for preview in settings
      saveLastOutput({
        eventId: event.id,
        photos: photos.map(p => p.dataUrl),
        compositeImage: finalImage,
        timestamp: Date.now(),
      });
    };

    composeImage();
  }, [photos, event.printLayout, event.id]);

  // Handle download
  const handleDownload = () => {
    if (!compositeImage) return;

    const link = document.createElement('a');
    link.href = compositeImage;
    link.download = `${event.name.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    link.click();
  };

  // Handle print
  const handlePrint = async () => {
    if (!compositeImage || isPrinting) return;

    setIsPrinting(true);

    // If auto-print is enabled and printer is connected, send to printer
    if (event.printing.autoPrint && event.printer.isConnected) {
      // In real implementation, would send to printer via WebUSB or backend
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      // Fallback to browser print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Photo</title>
              <style>
                @page { margin: 0; }
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; max-height: 100vh; }
              </style>
            </head>
            <body>
              <img src="${compositeImage}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    setIsPrinting(false);
  };

  // Auto-print if enabled
  useEffect(() => {
    if (event.printing.autoPrint && compositeImage) {
      handlePrint();
    }
  }, [compositeImage, event.printing.autoPrint]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black flex flex-col overflow-hidden">
      {/* Hidden canvas for composition */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header - Compact */}
      <div className="p-4 text-center flex-shrink-0">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-white"
        >
          Your Photos Are Ready!
        </motion.h1>
      </div>

      {/* Preview - Compact with max height */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative h-full flex items-center justify-center"
        >
          {compositeImage ? (
            <img
              src={compositeImage}
              alt="Photo strip"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            />
          ) : (
            <div className="h-64 w-32 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Actions - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 flex-shrink-0"
      >
        {/* Primary Actions */}
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3 mb-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={!compositeImage}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            disabled={!compositeImage || isPrinting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {isPrinting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Printer className="h-5 w-5" />
            )}
            <span>{isPrinting ? 'Printing...' : 'Print'}</span>
          </motion.button>
        </div>

        {/* Secondary Actions */}
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetake}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewSession}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>New Session</span>
          </motion.button>
        </div>

        {/* Copies info */}
        {event.printing.copies > 1 && (
          <p className="text-center text-white/40 text-sm mt-3">
            {event.printing.copies} copies will be printed
          </p>
        )}
      </motion.div>
    </div>
  );
}
