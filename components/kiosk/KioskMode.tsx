'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoboothEvent } from '@/lib/events/types';
import { LaunchScreen } from './LaunchScreen';
import { CaptureFlow } from './CaptureFlow';
import { ResultScreen } from './ResultScreen';

type KioskScreen = 'launch' | 'capture' | 'result';

interface KioskModeProps {
  event: PhotoboothEvent;
  onExit: () => void;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export function KioskMode({ event, onExit }: KioskModeProps) {
  const [screen, setScreen] = useState<KioskScreen>('launch');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenElement === null) {
          await containerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen not available:', err);
      }
    };
    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Handle ESC key to exit kiosk mode immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // Exit fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        // Exit kiosk mode
        onExit();
      }
    };

    // Use capture phase to intercept ESC before browser handles it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onExit]);

  // Start capture flow
  const handleStart = useCallback(() => {
    setPhotos([]);
    setScreen('capture');
  }, []);

  // Capture complete
  const handleCaptureComplete = useCallback((capturedPhotos: CapturedPhoto[]) => {
    setPhotos(capturedPhotos);
    setScreen('result');
  }, []);

  // Start new session
  const handleNewSession = useCallback(() => {
    setPhotos([]);
    setScreen('launch');
  }, []);

  // Retake photos
  const handleRetake = useCallback(() => {
    setPhotos([]);
    setScreen('capture');
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Exit hint - subtle, shown on all screens */}
      <div className="absolute top-4 left-4 z-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          className="text-white/50 text-xs px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm cursor-pointer"
          onClick={onExit}
        >
          Press ESC to exit
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'launch' && (
          <motion.div
            key="launch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <LaunchScreen
              config={event.launchPage}
              eventName={event.name}
              onStart={handleStart}
            />
          </motion.div>
        )}

        {screen === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0"
          >
            <CaptureFlow
              event={event}
              onComplete={handleCaptureComplete}
              onCancel={handleNewSession}
            />
          </motion.div>
        )}

        {screen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0"
          >
            <ResultScreen
              event={event}
              photos={photos}
              onNewSession={handleNewSession}
              onRetake={handleRetake}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
