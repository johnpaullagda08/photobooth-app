'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoboothEvent } from '@/lib/events/types';
import { Camera, X } from 'lucide-react';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

interface CaptureFlowProps {
  event: PhotoboothEvent;
  onComplete: (photos: CapturedPhoto[]) => void;
  onCancel: () => void;
}

export function CaptureFlow({ event, onComplete, onCancel }: CaptureFlowProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photosRef = useRef<CapturedPhoto[]>([]);
  const isCapturingRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoCount = event.printLayout.photoCount;
  const countdownDuration = event.countdown.duration;
  const isCountdownEnabled = event.countdown.enabled && event.countdown.beforeCapture;

  // Start camera
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: event.camera.deviceId
            ? { deviceId: { exact: event.camera.deviceId } }
            : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Check if component is still mounted
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            if (isMounted) {
              setIsReady(true);
            }
          } catch (playError) {
            // Ignore abort errors from unmounting
            if (playError instanceof Error && playError.name !== 'AbortError') {
              throw playError;
            }
          }
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (isMounted) {
          setError('Failed to access camera. Please grant camera permissions.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [event.camera.deviceId]);

  // Capture photo from video
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Detect iOS/iPadOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Check device orientation
    const isPortraitMode = window.matchMedia('(orientation: portrait)').matches;
    const videoIsLandscape = videoWidth > videoHeight;

    // On iOS, when device is in portrait but video reports landscape dimensions,
    // the raw video frames are rotated. We need to counter-rotate to match display.
    const needsRotation = isIOS && isPortraitMode && videoIsLandscape;

    console.log('Capture:', {
      isIOS,
      isPortraitMode,
      videoIsLandscape,
      needsRotation,
      videoWidth,
      videoHeight,
      displayWidth: video.clientWidth,
      displayHeight: video.clientHeight,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (needsRotation) {
      // Swap dimensions - output will be portrait (matching what user sees)
      canvas.width = videoHeight;
      canvas.height = videoWidth;

      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Rotate -90° (counter-clockwise) to correct iOS camera orientation
      ctx.rotate(-Math.PI / 2);

      // Apply mirror for front-facing camera (flip horizontally)
      if (event.camera.isMirrored) {
        ctx.scale(1, -1);
      }

      ctx.drawImage(video, -videoWidth / 2, -videoHeight / 2);
    } else {
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Apply mirror if enabled
      if (event.camera.isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [event.camera.isMirrored]);

  // Process capture - use refs to avoid dependency issues
  const processCapture = useCallback(() => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    const dataUrl = capturePhoto();
    if (!dataUrl) {
      isCapturingRef.current = false;
      return;
    }

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: Date.now(),
    };

    // Use ref to get current photos and update
    const updatedPhotos = [...photosRef.current, newPhoto];
    photosRef.current = updatedPhotos;
    setPhotos(updatedPhotos);

    // Check if complete
    if (updatedPhotos.length >= photoCount) {
      // Brief delay before showing results
      setTimeout(() => {
        onComplete(updatedPhotos);
      }, 500);
    } else {
      setCurrentPhotoIndex(updatedPhotos.length);
      // Start next countdown after pause
      isCapturingRef.current = false;
      setTimeout(() => {
        startCountdownInternal();
      }, 800);
    }
  }, [capturePhoto, photoCount, onComplete]);

  // Internal countdown function
  const startCountdownInternal = useCallback(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!isCountdownEnabled) {
      processCapture();
      return;
    }

    let count = countdownDuration;
    setCountdownValue(count);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdownValue(null);
        processCapture();
      } else {
        setCountdownValue(count);
      }
    }, 1000);
  }, [isCountdownEnabled, countdownDuration, processCapture]);

  // Auto-start countdown when ready
  const hasStarted = useRef(false);
  useEffect(() => {
    if (isReady && !hasStarted.current) {
      hasStarted.current = true;
      // Brief delay before starting
      const timeout = setTimeout(() => {
        startCountdownInternal();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isReady, startCountdownInternal]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full bg-black flex flex-col">
      {/* Camera Preview */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{error}</p>
              <button
                onClick={onCancel}
                className="mt-4 px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: event.camera.isMirrored ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Countdown Overlay */}
            <AnimatePresence>
              {countdownValue !== null && countdownValue > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <motion.div
                    key={countdownValue}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="text-white text-[200px] font-bold drop-shadow-2xl"
                  >
                    {countdownValue}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flash Effect */}
            <AnimatePresence>
              {showFlash && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-white"
                />
              )}
            </AnimatePresence>

            {/* Photo Progress */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-white font-bold text-lg">
                  Photo {currentPhotoIndex + 1} of {photoCount}
                </span>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Photo Thumbnails */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              {Array.from({ length: photoCount }).map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/30"
                >
                  {photos[index] ? (
                    <img
                      src={photos[index].dataUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-white/50 text-xs">{index + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
