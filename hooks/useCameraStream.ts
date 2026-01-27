'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CameraDevice, CameraSource } from '@/types';
import { CAMERA_CONSTRAINTS } from '@/constants/config';

interface UseCameraStreamOptions {
  source?: CameraSource;
  deviceId?: string;
  mirrored?: boolean;
}

interface UseCameraStreamReturn {
  stream: MediaStream | null;
  devices: CameraDevice[];
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  startStream: (deviceId?: string) => Promise<void>;
  stopStream: () => void;
  switchDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
}

export function useCameraStream(
  options: UseCameraStreamOptions = {}
): UseCameraStreamReturn {
  const { source = 'webcam', deviceId: initialDeviceId } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const streamRef = useRef<MediaStream | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
        }));
      setDevices(videoDevices);
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startStream = useCallback(
    async (deviceId?: string) => {
      if (source !== 'webcam' && source !== 'hdmi') {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Stop existing stream
      stopStream();

      try {
        const constraints: MediaStreamConstraints = {
          ...CAMERA_CONSTRAINTS,
          video: {
            ...(CAMERA_CONSTRAINTS.video as MediaTrackConstraints),
            ...(deviceId && { deviceId: { exact: deviceId } }),
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setPermissionStatus('granted');

        // Refresh devices now that we have permission
        await refreshDevices();
      } catch (err) {
        const error = err as Error;

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
          setError('Camera permission denied. Please allow camera access to continue.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setError('Camera is in use by another application. Please close other apps using the camera.');
        } else {
          setError(`Failed to access camera: ${error.message}`);
        }

        console.error('Camera error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [source, stopStream, refreshDevices]
  );

  const switchDevice = useCallback(
    async (deviceId: string) => {
      await startStream(deviceId);
    },
    [startStream]
  );

  // Check initial permission status
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((result) => {
          setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');

          result.addEventListener('change', () => {
            setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');
          });
        })
        .catch(() => {
          // Permissions API not fully supported, will check on getUserMedia
        });
    }
  }, []);

  // Handle device changes (plugging/unplugging cameras)
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    stream,
    devices,
    isLoading,
    error,
    permissionStatus,
    startStream,
    stopStream,
    switchDevice,
    refreshDevices,
  };
}
