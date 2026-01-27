'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, FlipHorizontal, Usb, Wifi, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CameraConfig } from '@/lib/events/types';

interface CameraSetupProps {
  config: CameraConfig;
  onUpdate: (config: CameraConfig) => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

export function CameraSetup({ config, onUpdate }: CameraSetupProps) {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
        }));
      setDevices(videoDevices);
      setError(null);
    } catch (err) {
      setError('Failed to access camera. Please grant camera permissions.');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPreview = async () => {
    // Stop existing stream
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
    }

    if (config.source !== 'webcam' && config.source !== 'hdmi') {
      setPreviewStream(null);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: config.deviceId
          ? { deviceId: { exact: config.deviceId } }
          : { facingMode: 'user' },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);
      setError(null);
    } catch (err) {
      setError('Failed to start camera preview.');
      console.error('Preview error:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    fetchDevices();

    return () => {
      // Stop all tracks when component unmounts
      setPreviewStream((currentStream) => {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => {
            track.stop();
            console.log('Camera track stopped:', track.label);
          });
        }
        return null;
      });
    };
  }, []);

  // Start preview when config changes
  useEffect(() => {
    startPreview();

    // Cleanup previous stream when config changes
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [config.deviceId, config.source]);

  const sourceOptions = [
    { value: 'webcam', label: 'Webcam', icon: Camera },
    { value: 'hdmi', label: 'HDMI Capture', icon: Monitor },
    { value: 'usb-tether', label: 'USB Tether (DSLR)', icon: Usb },
    { value: 'wifi', label: 'WiFi Transfer', icon: Wifi },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Camera Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Camera Source</CardTitle>
          <CardDescription>Select the camera input source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {sourceOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUpdate({ ...config, source: option.value })}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left',
                    config.source === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Camera Selection */}
      {(config.source === 'webcam' || config.source === 'hdmi') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Camera Device</CardTitle>
                <CardDescription>Select which camera to use</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDevices}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={config.deviceId || ''}
              onValueChange={(value) => onUpdate({ ...config, deviceId: value || null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a camera..." />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mirror Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mirror Preview</Label>
                <p className="text-sm text-muted-foreground">
                  Flip the camera horizontally
                </p>
              </div>
              <Switch
                checked={config.isMirrored}
                onCheckedChange={(checked) => onUpdate({ ...config, isMirrored: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Camera Preview</CardTitle>
            {previewStream && <Badge variant="secondary">Live</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive text-sm p-4 text-center">
                {error}
              </div>
            ) : previewStream ? (
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el) el.srcObject = previewStream;
                }}
                className={cn(
                  'w-full h-full object-cover',
                  config.isMirrored && 'scale-x-[-1]'
                )}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="h-12 w-12 mb-2" />
                <p className="text-sm">
                  {config.source === 'usb-tether'
                    ? 'USB tethering requires a connected DSLR'
                    : config.source === 'wifi'
                    ? 'WiFi transfer requires camera app setup'
                    : 'Select a camera to preview'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
