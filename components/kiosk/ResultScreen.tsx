'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PhotoboothEvent } from '@/lib/events/types';
import { Download, Printer, RotateCcw, Home, Loader2 } from 'lucide-react';
import { saveLastOutput } from '@/lib/photos/lastOutput';
import { PrintRenderer, usePrintDimensions } from '@/components/layout-editor';

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
  const [isComposing, setIsComposing] = useState(true);

  // Get proper print dimensions based on paper size
  const printDimensions = usePrintDimensions(event.paperSize, 300);

  // Extract layout config for easier access
  const { boxes, backgroundColor, backgroundImage, frameTemplate } = event.printLayout;

  // Calculate responsive container dimensions
  const containerStyle = useMemo(() => {
    // Strip = 2:6 (portrait), 4R = 6:4 (landscape)
    const aspectRatio = event.paperSize === 'strip' ? 2 / 6 : 6 / 4;

    return {
      aspectRatio: event.paperSize === 'strip' ? '2 / 6' : '6 / 4',
      // Max height constraint for viewport
      maxHeight: 'calc(100vh - 280px)',
      // Max width based on aspect ratio
      maxWidth: event.paperSize === 'strip' ? '280px' : '600px',
    };
  }, [event.paperSize]);

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

  // Compose the final image using proper layer hierarchy
  useEffect(() => {
    const composeImage = async () => {
      const canvas = canvasRef.current;
      if (!canvas || photos.length === 0) return;

      setIsComposing(true);

      // Use proper dimensions based on paper size
      const { width, height } = printDimensions;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      console.log(`Composing image: ${width}x${height} (${event.paperSize})`);

      // ========================================
      // LAYER HIERARCHY (matches PrintRenderer):
      // 1. Background Color (base)
      // 2. Background Image (above color)
      // 3. Photo Boxes (main content)
      // 4. Frame Overlay (above photos)
      // ========================================

      // LAYER 1: Background Color
      ctx.fillStyle = backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // LAYER 2: Background Image
      if (backgroundImage) {
        try {
          const bgImg = await loadImage(backgroundImage);
          // Draw background image to cover the entire canvas
          const bgRatio = bgImg.width / bgImg.height;
          const canvasRatio = width / height;

          let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;
          if (bgRatio > canvasRatio) {
            // Image is wider - crop sides
            sw = bgImg.height * canvasRatio;
            sx = (bgImg.width - sw) / 2;
          } else {
            // Image is taller - crop top/bottom
            sh = bgImg.width / canvasRatio;
            sy = (bgImg.height - sh) / 2;
          }

          ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height);
          console.log('Background image rendered');
        } catch (err) {
          console.error('Failed to load background image:', err);
        }
      }

      // LAYER 3: Photos in their boxes
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

          // Convert percentage-based box coordinates to pixels
          const x = (box.x / 100) * width;
          const y = (box.y / 100) * height;
          const w = (box.width / 100) * width;
          const h = (box.height / 100) * height;

          // Draw photo with object-fit: cover (fills the box, crops excess)
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
          console.log(`Drew photo ${i + 1} at (${x.toFixed(0)}, ${y.toFixed(0)}) size ${w.toFixed(0)}x${h.toFixed(0)}`);
        } catch (err) {
          console.error(`Failed to load photo ${i}:`, err);
        }
      }

      // LAYER 4: Frame Overlay (on top of everything)
      if (frameTemplate) {
        try {
          const frameImg = await loadImage(frameTemplate);
          ctx.drawImage(frameImg, 0, 0, width, height);
          console.log('Frame overlay rendered');
        } catch (err) {
          console.error('Failed to load frame template:', err);
        }
      }

      const finalImage = canvas.toDataURL('image/jpeg', 0.95);
      setCompositeImage(finalImage);
      setIsComposing(false);

      // Save to last output for preview in settings
      saveLastOutput({
        eventId: event.id,
        photos: photos.map(p => p.dataUrl),
        compositeImage: finalImage,
        timestamp: Date.now(),
      });
    };

    composeImage();
  }, [photos, boxes, backgroundColor, backgroundImage, frameTemplate, printDimensions, event.id, event.paperSize]);

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
      // Fallback to browser print with proper sizing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const { physicalWidth, physicalHeight } = printDimensions;
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Photo</title>
              <style>
                @page {
                  size: ${physicalWidth}in ${physicalHeight}in;
                  margin: 0;
                }
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #000;
                }
                img {
                  width: ${physicalWidth}in;
                  height: ${physicalHeight}in;
                  object-fit: contain;
                }
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
        <p className="text-white/50 text-sm mt-1">
          {event.paperSize === 'strip' ? '2×6 Photo Strip' : '4×6 Photo (4R)'}
        </p>
      </div>

      {/* Preview - Responsive container that maintains aspect ratio */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative flex items-center justify-center w-full h-full"
        >
          {compositeImage ? (
            // Show the final composed image
            <img
              src={compositeImage}
              alt="Photo output"
              className="rounded-lg shadow-2xl object-contain"
              style={{
                maxHeight: containerStyle.maxHeight,
                maxWidth: containerStyle.maxWidth,
                aspectRatio: containerStyle.aspectRatio,
              }}
            />
          ) : (
            // Show live preview using PrintRenderer while composing
            <div
              className="relative rounded-lg shadow-2xl overflow-hidden bg-white"
              style={{
                maxHeight: containerStyle.maxHeight,
                maxWidth: containerStyle.maxWidth,
                width: '100%',
              }}
            >
              <PrintRenderer
                boxes={boxes}
                paperSize={event.paperSize}
                backgroundColor={backgroundColor}
                backgroundImage={backgroundImage}
                frameTemplate={frameTemplate}
                photos={photos}
                showPlaceholders={false}
                width="100%"
              />
              {/* Loading overlay */}
              {isComposing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <span className="text-white text-sm">Processing...</span>
                  </div>
                </div>
              )}
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
