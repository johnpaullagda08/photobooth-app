'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Camera, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import type { TetheredCamera } from '@/types';

interface DSLRTetherViewProps {
  className?: string;
  onCapture?: (imageData: string) => void;
}

export function DSLRTetherView({ className, onCapture }: DSLRTetherViewProps) {
  const [cameras, setCameras] = useState<TetheredCamera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshCameras = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/camera/devices');
      const data = await response.json();

      if (data.success) {
        setCameras(data.cameras || []);
        if (data.cameras?.length > 0 && !selectedCamera) {
          setSelectedCamera(data.cameras[0].port);
        }
      } else {
        setError(data.error || 'Failed to detect cameras');
      }
    } catch (err) {
      setError('Failed to connect to camera service');
      console.error('Camera detection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCamera]);

  const capturePhoto = useCallback(async () => {
    if (!selectedCamera) return;

    setIsCapturing(true);
    setError(null);

    try {
      const response = await fetch('/api/camera/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: selectedCamera }),
      });

      const data = await response.json();

      if (data.success && data.imageData) {
        setLastCapture(data.imageData);
        onCapture?.(data.imageData);
      } else {
        setError(data.error || 'Capture failed');
      }
    } catch (err) {
      setError('Failed to capture photo');
      console.error('Capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [selectedCamera, onCapture]);

  // Refresh cameras on mount
  useEffect(() => {
    refreshCameras();
  }, [refreshCameras]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Camera Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {cameras.length > 0 ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-400">
                {cameras.length} camera{cameras.length > 1 ? 's' : ''} detected
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-400">No cameras detected</span>
            </>
          )}
        </div>

        <button
          onClick={refreshCameras}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg',
            'hover:bg-zinc-700 transition-colors text-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Camera Selector */}
      {cameras.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="dslr-select" className="text-sm text-zinc-400">
            Camera:
          </label>
          <select
            id="dslr-select"
            value={selectedCamera || ''}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className={cn(
              'flex-1 px-3 py-2 bg-zinc-800 text-white rounded-lg',
              'border border-zinc-700 focus:border-blue-500 focus:outline-none',
              'text-sm'
            )}
          >
            {cameras.map((camera) => (
              <option key={camera.port} value={camera.port}>
                {camera.model} ({camera.port})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Preview / Last Capture */}
      <div className="relative aspect-[3/2] bg-zinc-900 rounded-lg overflow-hidden">
        {lastCapture ? (
          <img
            src={lastCapture}
            alt="Last capture"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <Camera className="w-16 h-16" />
              <p>No capture yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <button
        onClick={capturePhoto}
        disabled={!selectedCamera || isCapturing}
        className={cn(
          'flex items-center justify-center gap-3 py-4 rounded-lg',
          'bg-blue-600 text-white font-semibold text-lg',
          'hover:bg-blue-700 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Camera className="w-6 h-6" />
        <span>{isCapturing ? 'Capturing...' : 'Capture Photo'}</span>
      </button>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Setup Instructions */}
      {cameras.length === 0 && !isLoading && (
        <div className="p-4 bg-zinc-800/50 rounded-lg">
          <h4 className="font-medium text-white mb-2">Setup Instructions</h4>
          <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
            <li>Connect your DSLR camera via USB</li>
            <li>Ensure gPhoto2 is installed on the server</li>
            <li>Make sure no other application is using the camera</li>
            <li>Click "Refresh" to detect the camera</li>
          </ol>
        </div>
      )}
    </div>
  );
}
