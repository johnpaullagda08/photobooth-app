'use client';

import { useCamera } from './CameraProvider';
import { cn } from '@/lib/utils';
import { FlipHorizontal, Camera, RefreshCw } from 'lucide-react';

interface CameraControlsProps {
  className?: string;
}

export function CameraControls({ className }: CameraControlsProps) {
  const {
    devices,
    activeDevice,
    isMirrored,
    stream,
    isLoading,
    startCamera,
    switchDevice,
    toggleMirror,
  } = useCamera();

  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      {/* Start/Restart Camera */}
      {!stream && (
        <button
          onClick={() => startCamera()}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg',
            'hover:bg-blue-700 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Camera className="w-5 h-5" />
          <span>Start Camera</span>
        </button>
      )}

      {stream && (
        <>
          {/* Device Selector */}
          {devices.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="camera-select"
                className="text-sm text-zinc-400"
              >
                Camera:
              </label>
              <select
                id="camera-select"
                value={activeDevice || ''}
                onChange={(e) => switchDevice(e.target.value)}
                className={cn(
                  'px-3 py-2 bg-zinc-800 text-white rounded-lg',
                  'border border-zinc-700 focus:border-blue-500 focus:outline-none',
                  'text-sm'
                )}
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mirror Toggle */}
          <button
            onClick={toggleMirror}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              isMirrored
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
            title={isMirrored ? 'Mirrored (click to flip)' : 'Normal (click to mirror)'}
          >
            <FlipHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isMirrored ? 'Mirrored' : 'Normal'}
            </span>
          </button>

          {/* Refresh Camera */}
          <button
            onClick={() => startCamera(activeDevice || undefined)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg',
              'hover:bg-zinc-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Refresh camera"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          </button>
        </>
      )}
    </div>
  );
}
