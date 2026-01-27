'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCamera } from './CameraProvider';
import { cn } from '@/lib/utils';

interface CameraPreviewProps {
  className?: string;
  filter?: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
}

export function CameraPreview({
  className,
  filter = 'none',
  onVideoReady,
}: CameraPreviewProps) {
  const { stream, isMirrored, isLoading, error, permissionStatus, videoRef } =
    useCamera();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Callback ref to sync both refs when video element is mounted
  const setVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      localVideoRef.current = element;
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
    },
    [videoRef]
  );

  // Attach stream to video element
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    const handleCanPlay = () => {
      video.play().catch(console.error);
      onVideoReady?.(video);
    };

    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [stream, onVideoReady]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-900 rounded-lg',
          className
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-600 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-400">Initializing camera...</p>
        </div>
      </div>
    );
  }

  // Permission denied
  if (permissionStatus === 'denied') {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-900 rounded-lg p-8',
          className
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Camera Access Denied</h3>
          <p className="text-zinc-400 max-w-sm">
            Please allow camera access in your browser settings to use the
            photobooth.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-900 rounded-lg p-8',
          className
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Camera Error</h3>
          <p className="text-zinc-400 max-w-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No stream yet
  if (!stream) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-900 rounded-lg p-8',
          className
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Camera Ready</h3>
          <p className="text-zinc-400">Click "Start Camera" to begin</p>
        </div>
      </div>
    );
  }

  // Camera feed
  return (
    <div className={cn('relative overflow-hidden bg-black', className)}>
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 w-full h-full object-cover',
          isMirrored && 'scale-x-[-1]'
        )}
        style={{ filter }}
      />
    </div>
  );
}
