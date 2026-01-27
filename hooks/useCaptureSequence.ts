'use client';

import { useState, useCallback, useRef } from 'react';
import type { CapturedPhoto, PhotoCount, CountdownDuration } from '@/types';
import { useCountdown } from './useCountdown';

interface UseCaptureSequenceOptions {
  photoCount: PhotoCount;
  countdownDuration: CountdownDuration;
  onPhotoCapture?: (photo: CapturedPhoto, index: number) => void;
  onSequenceComplete?: (photos: CapturedPhoto[]) => void;
}

interface UseCaptureSequenceReturn {
  photos: CapturedPhoto[];
  isCapturing: boolean;
  currentPhotoIndex: number;
  countdownRemaining: number;
  isCountdownActive: boolean;
  startSequence: () => void;
  capturePhoto: () => CapturedPhoto | null;
  retakePhoto: (index: number) => void;
  reset: () => void;
  setVideoRef: (video: HTMLVideoElement | null) => void;
}

export function useCaptureSequence(
  options: UseCaptureSequenceOptions
): UseCaptureSequenceReturn {
  const { photoCount, countdownDuration, onPhotoCapture, onSequenceComplete } = options;

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMirroredRef = useRef(true);

  const handleCountdownComplete = useCallback(() => {
    // Capture photo when countdown completes
    const photo = captureFromVideo();
    if (photo) {
      const index = currentPhotoIndex;
      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = photo;
        return newPhotos;
      });
      onPhotoCapture?.(photo, index);

      const nextIndex = index + 1;
      if (nextIndex < photoCount) {
        // Continue to next photo
        setCurrentPhotoIndex(nextIndex);
        setTimeout(() => {
          countdown.start();
        }, 500); // Brief pause between photos
      } else {
        // Sequence complete
        setIsCapturing(false);
        setPhotos((prev) => {
          onSequenceComplete?.(prev);
          return prev;
        });
      }
    }
  }, [currentPhotoIndex, photoCount, onPhotoCapture, onSequenceComplete]);

  const countdown = useCountdown({
    duration: countdownDuration,
    onComplete: handleCountdownComplete,
  });

  const captureFromVideo = useCallback((): CapturedPhoto | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Handle mirroring
    if (isMirroredRef.current) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');

    return {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      dataUrl,
      timestamp: Date.now(),
      filterId: 'none',
    };
  }, []);

  const startSequence = useCallback(() => {
    setPhotos([]);
    setCurrentPhotoIndex(0);
    setIsCapturing(true);
    countdown.start();
  }, [countdown]);

  const capturePhoto = useCallback((): CapturedPhoto | null => {
    return captureFromVideo();
  }, [captureFromVideo]);

  const retakePhoto = useCallback(
    (index: number) => {
      if (index < 0 || index >= photos.length) return;

      setCurrentPhotoIndex(index);
      setIsCapturing(true);
      countdown.start();
    },
    [photos.length, countdown]
  );

  const reset = useCallback(() => {
    countdown.reset();
    setPhotos([]);
    setCurrentPhotoIndex(0);
    setIsCapturing(false);
  }, [countdown]);

  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
  }, []);

  return {
    photos,
    isCapturing,
    currentPhotoIndex,
    countdownRemaining: countdown.remaining,
    isCountdownActive: countdown.isRunning,
    startSequence,
    capturePhoto,
    retakePhoto,
    reset,
    setVideoRef,
  };
}
