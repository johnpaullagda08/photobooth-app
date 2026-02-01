'use client';

import { useCamera } from './CameraProvider';
import { cn } from '@/lib/utils';
import type { CameraSource } from '@/types';
import { Video, MonitorUp, Usb, Wifi, ServerOff } from 'lucide-react';

interface CameraSourceSelectorProps {
  className?: string;
}

// Features that require a local server (gPhoto2, file system access)
const SERVER_REQUIRED_SOURCES: CameraSource[] = ['usb-tether', 'wifi'];

// Check if running in static/hosted mode (no server)
const isStaticMode = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

const SOURCES: { id: CameraSource; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'webcam',
    label: 'Webcam',
    icon: <Video className="w-5 h-5" />,
    description: 'Built-in or USB webcam',
  },
  {
    id: 'hdmi',
    label: 'HDMI Capture',
    icon: <MonitorUp className="w-5 h-5" />,
    description: 'HDMI capture card input',
  },
  {
    id: 'usb-tether',
    label: 'USB Tethering',
    icon: <Usb className="w-5 h-5" />,
    description: 'DSLR via gPhoto2',
  },
  {
    id: 'wifi',
    label: 'WiFi Transfer',
    icon: <Wifi className="w-5 h-5" />,
    description: 'Camera WiFi app',
  },
];

export function CameraSourceSelector({ className }: CameraSourceSelectorProps) {
  const { source, switchSource, stopCamera } = useCamera();

  const handleSourceChange = (newSource: CameraSource) => {
    if (newSource !== source) {
      stopCamera();
      switchSource(newSource);
    }
  };

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
      {SOURCES.map((s) => {
        const isDisabled = isStaticMode && SERVER_REQUIRED_SOURCES.includes(s.id);

        return (
          <button
            key={s.id}
            onClick={() => !isDisabled && handleSourceChange(s.id)}
            disabled={isDisabled}
            title={isDisabled ? 'Requires local server (run npm run dev)' : undefined}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg transition-all relative',
              'border-2',
              isDisabled
                ? 'border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed opacity-50'
                : source === s.id
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800'
            )}
          >
            {isDisabled && (
              <div className="absolute top-2 right-2">
                <ServerOff className="w-3 h-3 text-zinc-600" />
              </div>
            )}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isDisabled
                  ? 'bg-zinc-800'
                  : source === s.id
                    ? 'bg-blue-500/20'
                    : 'bg-zinc-700'
              )}
            >
              {s.icon}
            </div>
            <span className="font-medium text-sm">{s.label}</span>
            <span className="text-xs text-zinc-500 text-center">
              {isDisabled ? 'Local server only' : s.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
