'use client';

import { useCamera } from './CameraProvider';
import { cn } from '@/lib/utils';
import type { CameraSource } from '@/types';
import { Video, MonitorUp, Usb, Wifi } from 'lucide-react';

interface CameraSourceSelectorProps {
  className?: string;
}

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
      {SOURCES.map((s) => (
        <button
          key={s.id}
          onClick={() => handleSourceChange(s.id)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-lg transition-all',
            'border-2',
            source === s.id
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800'
          )}
        >
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              source === s.id ? 'bg-blue-500/20' : 'bg-zinc-700'
            )}
          >
            {s.icon}
          </div>
          <span className="font-medium text-sm">{s.label}</span>
          <span className="text-xs text-zinc-500 text-center">{s.description}</span>
        </button>
      ))}
    </div>
  );
}
