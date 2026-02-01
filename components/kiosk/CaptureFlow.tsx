'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoboothEvent } from '@/lib/events/types';
import { Camera, X, Usb, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

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

// USB Tether capture via API
async function captureDSLRPhoto(port?: string): Promise<string | null> {
  try {
    const response = await fetch('/api/camera/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port }),
    });

    const data = await response.json();

    if (data.success && data.imageData) {
      return data.imageData;
    }

    console.error('DSLR capture failed:', data.error);
    return null;
  } catch (error) {
    console.error('DSLR capture error:', error);
    return null;
  }
}

// Detect connected DSLR cameras via API
async function detectDSLRCameras(): Promise<{ model: string; port: string }[]> {
  try {
    const response = await fetch('/api/camera/devices');
    const data = await response.json();

    if (data.success && data.cameras) {
      return data.cameras;
    }

    return [];
  } catch {
    return [];
  }
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
  const [isCapturingDSLR, setIsCapturingDSLR] = useState(false);

  // USB Tether state
  const [dslrCameras, setDslrCameras] = useState<{ model: string; port: string }[]>([]);
  const [selectedDSLRPort, setSelectedDSLRPort] = useState<string | null>(null);
  const [dslrError, setDslrError] = useState<string | null>(null);

  // Determine capture mode
  const isUSBTetherMode = event.camera.source === 'usb-tether';
  const isMediaStreamMode = event.camera.source === 'webcam' || event.camera.source === 'hdmi';

  // Derive photo count from the number of boxes in the layout
  const photoCount = event.printLayout.boxes.length;
  const countdownDuration = event.countdown.duration;
  const isCountdownEnabled = event.countdown.enabled && event.countdown.beforeCapture;

  // Initialize USB Tether mode
  useEffect(() => {
    if (!isUSBTetherMode) return;

    let isMounted = true;

    const initDSLR = async () => {
      const cameras = await detectDSLRCameras();

      if (!isMounted) return;

      if (cameras.length === 0) {
        setDslrError('No DSLR camera detected. Please connect your camera via USB and ensure gPhoto2 is installed.');
        return;
      }

      setDslrCameras(cameras);
      setSelectedDSLRPort(cameras[0].port);
      setIsReady(true);
    };

    initDSLR();

    return () => {
      isMounted = false;
    };
  }, [isUSBTetherMode]);

  // Start camera for MediaStream mode (webcam/HDMI)
  useEffect(() => {
    if (!isMediaStreamMode) return;

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
            if (playError instanceof Error && playError.name !== 'AbortError') {
              throw playError;
            }
          }
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          if (errorMessage.includes('NotFound') || errorMessage.includes('DevicesNotFound')) {
            setError('Camera not found. Please connect a camera and try again.');
          } else if (errorMessage.includes('NotAllowed') || errorMessage.includes('Permission')) {
            setError('Camera access denied. Please grant camera permissions.');
          } else if (errorMessage.includes('NotReadable') || errorMessage.includes('TrackStart')) {
            setError('Camera is in use by another application. Please close other apps using the camera.');
          } else {
            setError('Failed to access camera. Please check your camera connection.');
          }
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
  }, [event.camera.deviceId, isMediaStreamMode]);

  // Capture photo from video (for webcam/HDMI mode)
  const captureFromVideo = useCallback(() => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Detect iOS/iPadOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isPortraitMode = window.matchMedia('(orientation: portrait)').matches;
    const videoIsLandscape = videoWidth > videoHeight;
    const needsRotation = isIOS && isPortraitMode && videoIsLandscape;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (needsRotation) {
      canvas.width = videoHeight;
      canvas.height = videoWidth;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      if (event.camera.isMirrored) {
        ctx.scale(1, -1);
      }
      ctx.drawImage(video, -videoWidth / 2, -videoHeight / 2);
    } else {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      if (event.camera.isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [event.camera.isMirrored]);

  // Process capture - handles both webcam and DSLR modes
  const processCapture = useCallback(async () => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    let dataUrl: string | null = null;

    if (isUSBTetherMode) {
      // USB Tether mode: capture via API
      setIsCapturingDSLR(true);
      dataUrl = await captureDSLRPhoto(selectedDSLRPort || undefined);
      setIsCapturingDSLR(false);

      if (!dataUrl) {
        setDslrError('Failed to capture from DSLR. Please check the connection.');
        isCapturingRef.current = false;
        return;
      }
    } else {
      // Webcam/HDMI mode: capture from video
      dataUrl = captureFromVideo();
      if (!dataUrl) {
        isCapturingRef.current = false;
        return;
      }
    }

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: Date.now(),
    };

    const updatedPhotos = [...photosRef.current, newPhoto];
    photosRef.current = updatedPhotos;
    setPhotos(updatedPhotos);

    // Check if complete
    if (updatedPhotos.length >= photoCount) {
      setTimeout(() => {
        onComplete(updatedPhotos);
      }, 500);
    } else {
      setCurrentPhotoIndex(updatedPhotos.length);
      isCapturingRef.current = false;
      setTimeout(() => {
        startCountdownInternal();
      }, 800);
    }
  }, [isUSBTetherMode, selectedDSLRPort, captureFromVideo, photoCount, onComplete]);

  // Internal countdown function
  const startCountdownInternal = useCallback(() => {
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

  // Retry DSLR detection
  const retryDSLR = async () => {
    setDslrError(null);
    const cameras = await detectDSLRCameras();

    if (cameras.length === 0) {
      setDslrError('No DSLR camera detected. Please check the USB connection.');
      return;
    }

    setDslrCameras(cameras);
    setSelectedDSLRPort(cameras[0].port);
    setIsReady(true);
  };

  // Render error state
  const renderError = (errorMessage: string, onRetry?: () => void) => (
    <div className="absolute inset-0 flex items-center justify-center text-white">
      <div className="text-center max-w-md px-6">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
        <p className="text-lg mb-4">{errorMessage}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

  // Render USB Tether mode UI
  const renderUSBTetherUI = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
      {dslrError ? (
        renderError(dslrError, retryDSLR)
      ) : !isReady ? (
        <div className="text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-white animate-spin" />
          <p className="text-white text-lg">Detecting DSLR camera...</p>
        </div>
      ) : (
        <>
          {/* DSLR Info */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
              <Usb className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">
                {dslrCameras.find(c => c.port === selectedDSLRPort)?.model || 'DSLR Connected'}
              </span>
            </div>
          </div>

          {/* Camera Icon */}
          <div className="relative mb-8">
            <div className="w-48 h-48 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <Camera className="w-24 h-24 text-white/70" />
            </div>
            {isCapturingDSLR && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-white/60 text-center max-w-sm">
            Your DSLR camera will capture when the countdown ends.
            Make sure your camera is ready and focused.
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-black flex flex-col">
      {/* Camera Preview / USB Tether UI */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          renderError(error)
        ) : isUSBTetherMode ? (
          renderUSBTetherUI()
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
          </>
        )}

        {/* USB Tether Countdown Overlay (separate since it doesn't have video background) */}
        {isUSBTetherMode && isReady && !dslrError && (
          <AnimatePresence>
            {countdownValue !== null && countdownValue > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"
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
        )}

        {/* USB Tether Flash Effect */}
        {isUSBTetherMode && (
          <AnimatePresence>
            {showFlash && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-white z-20"
              />
            )}
          </AnimatePresence>
        )}

        {/* Photo Progress */}
        {(isReady || isMediaStreamMode) && !error && !dslrError && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-white font-bold text-lg">
                Photo {currentPhotoIndex + 1} of {photoCount}
              </span>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-30"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {/* Photo Thumbnails */}
        {(isReady || isMediaStreamMode) && !error && !dslrError && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
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
        )}

        {/* DSLR Camera Selector (if multiple cameras) */}
        {isUSBTetherMode && dslrCameras.length > 1 && isReady && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
            <select
              value={selectedDSLRPort || ''}
              onChange={(e) => setSelectedDSLRPort(e.target.value)}
              className="px-4 py-2 bg-black/60 text-white rounded-lg border border-white/30 backdrop-blur-sm"
            >
              {dslrCameras.map((camera) => (
                <option key={camera.port} value={camera.port}>
                  {camera.model}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
