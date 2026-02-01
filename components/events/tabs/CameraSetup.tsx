'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  RefreshCw,
  Usb,
  Wifi,
  Monitor,
  ServerOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
  AppWindow,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CameraConfig } from '@/lib/events/types';
import {
  detectCameraDevice,
  getDeviceTypeLabel,
  sortDevicesByPriority,
  isDeviceSuitableForPhotobooth,
  getProfessionalCameraBadge,
  type DetectedCameraDevice,
  type CameraDeviceType,
} from '@/lib/camera/device-detection';

// Check if running in static/hosted mode (no server)
const isStaticMode = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

interface CameraSetupProps {
  config: CameraConfig;
  onUpdate: (config: CameraConfig) => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
  status: 'available' | 'unavailable' | 'checking';
  groupId: string;
  type: CameraDeviceType;
  brand?: string;
  isLikelyProfessional: boolean;
  /** @deprecated Use isLikelyProfessional instead */
  isLikelyDSLR: boolean;
}

const statusConfig = {
  available: { icon: CheckCircle2, label: 'Available', color: 'text-green-500', bg: 'bg-green-500/10' },
  checking: { icon: RefreshCw, label: 'Checking...', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  unavailable: { icon: XCircle, label: 'Unavailable', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const deviceTypeConfig: Record<CameraDeviceType, { icon: typeof Camera; color: string; bgColor: string }> = {
  'mirrorless': { icon: Camera, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  'hdmi-capture': { icon: Monitor, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  'webcam': { icon: Video, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  'virtual': { icon: AppWindow, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  'unknown': { icon: Camera, color: 'text-zinc-500', bgColor: 'bg-zinc-500/10' },
};

export function CameraSetup({ config, onUpdate }: CameraSetupProps) {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  // Check camera permission status
  const checkPermission = useCallback(async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');

        // Listen for permission changes
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          if (result.state === 'granted') {
            fetchDevices();
          }
        };
      }
    } catch {
      // Permissions API not supported
      setPermissionStatus('unknown');
    }
  }, []);

  // Test if a camera is actually usable
  const testCameraAvailability = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      // Camera is available, stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    // Check if mediaDevices API is available
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('Camera API not available in this browser.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request camera permission first to get device labels
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      initialStream.getTracks().forEach(track => track.stop());

      // Get all video devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');

      if (videoDevices.length === 0) {
        setDevices([]);
        setError('No cameras detected. Please connect a camera.');
        setIsLoading(false);
        return;
      }

      // Detect device types and create device list with checking status
      const detectedDevices: DetectedCameraDevice[] = videoDevices.map(detectCameraDevice);
      const sortedDevices = sortDevicesByPriority(detectedDevices);

      const devicesWithStatus: CameraDevice[] = sortedDevices.map((d) => ({
        deviceId: d.deviceId,
        label: d.label,
        status: 'checking' as const,
        groupId: d.groupId,
        type: d.type,
        brand: d.brand,
        isLikelyProfessional: d.isLikelyProfessional,
        isLikelyDSLR: d.isLikelyDSLR,
      }));

      setDevices(devicesWithStatus);

      // Test each camera's availability (filter out virtual cameras)
      const testedDevices = await Promise.all(
        devicesWithStatus.map(async (device) => {
          // Skip availability check for virtual cameras
          if (device.type === 'virtual') {
            return { ...device, status: 'unavailable' as const };
          }
          const isAvailable = await testCameraAvailability(device.deviceId);
          return {
            ...device,
            status: isAvailable ? 'available' as const : 'unavailable' as const,
          };
        })
      );

      setDevices(testedDevices);

      // Auto-select first available camera (prefer HDMI capture cards for DSLR)
      const availableDevices = testedDevices.filter(d => d.status === 'available');
      const currentDeviceAvailable = testedDevices.find(
        d => d.deviceId === config.deviceId && d.status === 'available'
      );

      if (!currentDeviceAvailable && availableDevices.length > 0) {
        // Prefer mirrorless cameras first, then HDMI capture cards (likely DSLR)
        const preferredDevice =
          availableDevices.find(d => d.type === 'mirrorless') ||
          availableDevices.find(d => d.type === 'hdmi-capture') ||
          availableDevices[0];
        onUpdate({ ...config, deviceId: preferredDevice.deviceId });
      } else if (availableDevices.length === 0) {
        setError('No cameras are currently available. Please check connections.');
      }

      setPermissionStatus('granted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Camera access denied. Please grant camera permissions in your browser settings.');
        setPermissionStatus('denied');
      } else {
        setError('Failed to access cameras. Please check permissions and connections.');
      }
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config, onUpdate, testCameraAvailability]);

  const startPreview = useCallback(async () => {
    // Stop existing stream
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
    }

    // Check if mediaDevices API is available
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setPreviewStream(null);
      return;
    }

    if (config.source !== 'webcam' && config.source !== 'hdmi') {
      setPreviewStream(null);
      return;
    }

    if (!config.deviceId) {
      setPreviewStream(null);
      return;
    }

    // Check if the selected device is available
    const device = devices.find(d => d.deviceId === config.deviceId);
    if (device && device.status !== 'available') {
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
      setPreviewStream(null);
    }
  }, [config.deviceId, config.source, devices, previewStream]);

  // Listen for device changes (camera plugged in/unplugged)
  useEffect(() => {
    // Check if mediaDevices API is available (not available in all environments)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return;
    }

    const handleDeviceChange = () => {
      fetchDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [fetchDevices]);

  // Initial setup
  useEffect(() => {
    checkPermission();
    fetchDevices();

    return () => {
      // Stop all tracks when component unmounts
      if (previewStream) {
        previewStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // Start preview when config or devices change
  useEffect(() => {
    startPreview();

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [config.deviceId, config.source, devices.length]);

  const selectCamera = (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (device && device.status === 'available') {
      onUpdate({ ...config, deviceId });
    }
  };

  const sourceOptions = [
    { value: 'webcam', label: 'Webcam', icon: Camera, requiresServer: false, description: 'Built-in or USB webcam' },
    { value: 'hdmi', label: 'HDMI Capture', icon: Monitor, requiresServer: false, description: 'DSLR via capture card' },
    { value: 'usb-tether', label: 'USB Tether (DSLR)', icon: Usb, requiresServer: true, description: 'Direct USB with gPhoto2' },
    { value: 'wifi', label: 'WiFi Transfer', icon: Wifi, requiresServer: true, description: 'Camera WiFi app' },
  ] as const;

  const availableCameras = devices.filter(d => d.status === 'available');
  const professionalCameras = availableCameras.filter(d => d.isLikelyProfessional);
  const mirrorlessCameras = availableCameras.filter(d => d.type === 'mirrorless');
  const hdmiCaptureDevices = availableCameras.filter(d => d.type === 'hdmi-capture');
  const selectedDevice = devices.find(d => d.deviceId === config.deviceId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Camera Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Camera Source</CardTitle>
          <CardDescription>Select how your camera connects to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {sourceOptions.map((option) => {
              const Icon = option.icon;
              const isDisabled = isStaticMode && option.requiresServer;
              return (
                <motion.button
                  key={option.value}
                  whileHover={isDisabled ? {} : { scale: 1.02 }}
                  whileTap={isDisabled ? {} : { scale: 0.98 }}
                  onClick={() => !isDisabled && onUpdate({ ...config, source: option.value })}
                  disabled={isDisabled}
                  title={isDisabled ? 'Requires local server (run npm run dev)' : option.description}
                  className={cn(
                    'flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-colors text-left relative',
                    isDisabled
                      ? 'border-muted bg-muted/20 text-muted-foreground cursor-not-allowed opacity-50'
                      : config.source === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                  )}
                >
                  {isDisabled && (
                    <ServerOff className="absolute top-2 right-2 h-3 w-3 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isDisabled ? 'Local server only' : option.description}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Professional Camera Detection Notice */}
      {professionalCameras.length > 0 && (config.source === 'webcam' || config.source === 'hdmi') && (
        <Card className={cn(
          mirrorlessCameras.length > 0
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-purple-500/30 bg-purple-500/5'
        )}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                mirrorlessCameras.length > 0 ? 'bg-emerald-500/10' : 'bg-purple-500/10'
              )}>
                <Sparkles className={cn(
                  'h-5 w-5',
                  mirrorlessCameras.length > 0 ? 'text-emerald-500' : 'text-purple-500'
                )} />
              </div>
              <div>
                <p className={cn(
                  'font-medium',
                  mirrorlessCameras.length > 0 ? 'text-emerald-400' : 'text-purple-400'
                )}>
                  {mirrorlessCameras.length > 0
                    ? 'Mirrorless Camera Detected!'
                    : 'DSLR Detected!'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {mirrorlessCameras.length > 0 && (
                    <>
                      We detected {mirrorlessCameras.length} mirrorless {mirrorlessCameras.length > 1 ? 'cameras' : 'camera'} connected via USB.
                      {mirrorlessCameras.map(d => d.brand).filter(Boolean).length > 0 && (
                        <span className="block mt-1">
                          Brand: {[...new Set(mirrorlessCameras.map(d => d.brand).filter(Boolean))].join(', ')}
                        </span>
                      )}
                    </>
                  )}
                  {hdmiCaptureDevices.length > 0 && mirrorlessCameras.length === 0 && (
                    <>
                      We detected {hdmiCaptureDevices.length} HDMI capture {hdmiCaptureDevices.length > 1 ? 'devices' : 'device'} which may be your DSLR camera.
                      {hdmiCaptureDevices.map(d => d.brand).filter(Boolean).length > 0 && (
                        <span className="block mt-1">
                          Brand: {[...new Set(hdmiCaptureDevices.map(d => d.brand).filter(Boolean))].join(', ')}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Selection */}
      {(config.source === 'webcam' || config.source === 'hdmi') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Available Cameras</CardTitle>
                <CardDescription>
                  {availableCameras.length === 0
                    ? 'No cameras available'
                    : `${availableCameras.length} camera${availableCameras.length > 1 ? 's' : ''} detected`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDevices}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                {isLoading ? 'Scanning...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
                <p className="font-medium">Camera Permission Required</p>
                <p className="mt-1">Please allow camera access in your browser settings and refresh.</p>
              </div>
            )}

            {devices.length === 0 && !isLoading && !error ? (
              <div className="text-center py-6 text-muted-foreground">
                <Camera className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cameras found</p>
                <p className="text-xs mt-1">Connect a camera and click Refresh</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => {
                  const status = statusConfig[device.status];
                  const StatusIcon = status.icon;
                  const typeConfig = deviceTypeConfig[device.type];
                  const TypeIcon = typeConfig.icon;
                  const isSelected = config.deviceId === device.deviceId;
                  const isAvailable = device.status === 'available';

                  return (
                    <motion.button
                      key={device.deviceId}
                      whileHover={isAvailable ? { scale: 1.01 } : {}}
                      whileTap={isAvailable ? { scale: 0.99 } : {}}
                      onClick={() => isAvailable && selectCamera(device.deviceId)}
                      disabled={!isAvailable}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left',
                        !isAvailable
                          ? 'border-muted bg-muted/20 cursor-not-allowed opacity-60'
                          : isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                        <TypeIcon className={cn('h-5 w-5', typeConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('font-medium truncate', !isAvailable && 'text-muted-foreground')}>
                            {device.label}
                          </p>
                          {device.isLikelyProfessional && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] px-1.5',
                                device.type === 'mirrorless'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              )}
                            >
                              {getProfessionalCameraBadge(device.type) || 'Professional'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn('text-[10px] px-1.5', typeConfig.color)}>
                            {getDeviceTypeLabel(device.type)}
                          </Badge>
                          {device.brand && device.brand !== 'Generic' && (
                            <span className="text-xs text-muted-foreground">{device.brand}</span>
                          )}
                        </div>
                      </div>

                      <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full', status.bg)}>
                        <StatusIcon className={cn('h-4 w-4', status.color, device.status === 'checking' && 'animate-spin')} />
                        <span className={cn('text-xs font-medium', status.color)}>
                          {status.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Mirror Toggle */}
            {selectedDevice && selectedDevice.status === 'available' && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Mirror Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevice.isLikelyProfessional
                      ? 'Usually OFF for DSLR/mirrorless cameras'
                      : 'Flip the camera horizontally (selfie mode)'}
                  </p>
                </div>
                <Switch
                  checked={config.isMirrored}
                  onCheckedChange={(checked) => onUpdate({ ...config, isMirrored: checked })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Camera Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Camera Preview</CardTitle>
            {previewStream && <Badge variant="secondary" className="bg-green-500/10 text-green-500">Live</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            {error && !previewStream ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive text-sm p-4 text-center">
                <div>
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p>{error}</p>
                </div>
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
                <Camera className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">
                  {config.source === 'usb-tether'
                    ? 'USB tethering requires a connected DSLR'
                    : config.source === 'wifi'
                    ? 'WiFi transfer requires camera app setup'
                    : devices.length === 0
                    ? 'Connect a camera to see preview'
                    : !config.deviceId
                    ? 'Select a camera to preview'
                    : 'Starting preview...'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Camera Setup Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-500" />
                Mirrorless Camera via USB (Easiest)
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-6">
                <li>Connect your mirrorless camera via USB cable</li>
                <li>Enable USB streaming/webcam mode on your camera</li>
                <li>Sony: USB Connection → PC Remote, Fuji: USB RAW Conv./PC Auto</li>
                <li>Canon: Use Canon EOS Webcam Utility or enable webcam mode</li>
                <li>The camera will appear directly in the list</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-500" />
                DSLR via HDMI Capture Card
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-6">
                <li>Connect your DSLR to an HDMI capture card (Elgato, AVerMedia, etc.)</li>
                <li>The capture card will appear in the camera list</li>
                <li>Set your camera to video/movie mode for live preview</li>
                <li>Works with Canon, Nikon, Sony, Fujifilm, Panasonic, and more</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" />
                Camera not detected?
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-6">
                <li>Make sure the camera is connected and powered on</li>
                <li>Allow camera access when prompted by your browser</li>
                <li>Close other apps that might be using the camera</li>
                <li>Try clicking "Refresh" to rescan for cameras</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Usb className="h-4 w-4 text-green-500" />
                USB Tethering (Advanced)
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-6">
                <li>Requires gPhoto2 installed on the server</li>
                <li>Supports Canon, Nikon, and many other DSLRs</li>
                <li>Triggers the camera shutter directly via USB</li>
                <li>Only available when running locally (npm run dev)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
