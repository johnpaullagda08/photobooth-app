'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, FolderOpen, RefreshCw, AlertCircle, Image } from 'lucide-react';
import type { WiFiImageResult } from '@/types';
import { WIFI_POLL_INTERVAL } from '@/constants/config';

interface WiFiCameraViewProps {
  className?: string;
  onNewImage?: (imageData: string) => void;
}

export function WiFiCameraView({ className, onNewImage }: WiFiCameraViewProps) {
  const [folderPath, setFolderPath] = useState('/tmp/camera-wifi');
  const [isPolling, setIsPolling] = useState(false);
  const [lastImage, setLastImage] = useState<WiFiImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef<number>(0);

  const pollForImages = useCallback(async () => {
    try {
      const response = await fetch('/api/wifi/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          since: lastTimestampRef.current,
        }),
      });

      const data = await response.json();

      if (data.success && data.images?.length > 0) {
        // Get the most recent image
        const latestImage = data.images[data.images.length - 1];
        setLastImage(latestImage);
        setImageCount((prev) => prev + data.images.length);
        lastTimestampRef.current = latestImage.timestamp;
        onNewImage?.(latestImage.imageData);
      }

      setError(null);
    } catch (err) {
      console.error('WiFi poll error:', err);
      // Don't show error for network issues during polling
    }
  }, [folderPath, onNewImage]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    setIsPolling(true);
    setError(null);
    lastTimestampRef.current = Date.now();

    // Initial poll
    pollForImages();

    // Set up interval
    pollIntervalRef.current = setInterval(pollForImages, WIFI_POLL_INTERVAL);
  }, [pollForImages]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Folder Path Input */}
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="WiFi transfer folder path"
          disabled={isPolling}
          className={cn(
            'flex-1 px-3 py-2 bg-zinc-800 text-white rounded-lg',
            'border border-zinc-700 focus:border-blue-500 focus:outline-none',
            'text-sm',
            'disabled:opacity-50'
          )}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isPolling ? stopPolling : startPolling}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
            isPolling
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700',
            'transition-colors'
          )}
        >
          {isPolling ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Stop Polling</span>
            </>
          ) : (
            <>
              <Wifi className="w-5 h-5" />
              <span>Start Polling</span>
            </>
          )}
        </button>

        {isPolling && (
          <span className="text-sm text-zinc-400">
            Watching for new images...
          </span>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isPolling ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'
            )}
          />
          <span className="text-zinc-400">
            {isPolling ? 'Monitoring' : 'Idle'}
          </span>
        </div>
        <div className="text-zinc-500">
          {imageCount} image{imageCount !== 1 ? 's' : ''} received
        </div>
      </div>

      {/* Preview */}
      <div className="relative aspect-[3/2] bg-zinc-900 rounded-lg overflow-hidden">
        {lastImage ? (
          <img
            src={lastImage.imageData}
            alt={`WiFi transfer: ${lastImage.filename}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <Image className="w-16 h-16" />
              <p>Waiting for images...</p>
            </div>
          </div>
        )}

        {lastImage && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-zinc-300">
            {lastImage.filename}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="p-4 bg-zinc-800/50 rounded-lg">
        <h4 className="font-medium text-white mb-2">How it works</h4>
        <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
          <li>Set your camera WiFi app to save images to the folder above</li>
          <li>Click "Start Polling" to watch for new images</li>
          <li>Take photos on your camera - they will appear here automatically</li>
          <li>Images are processed and added to your photo strip</li>
        </ol>
      </div>
    </div>
  );
}
