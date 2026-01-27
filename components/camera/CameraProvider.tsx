'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import type { CameraState, CameraAction, CameraDevice, CameraSource } from '@/types';
import { CAMERA_CONSTRAINTS } from '@/constants/config';

interface CameraContextValue extends CameraState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchDevice: (deviceId: string) => Promise<void>;
  switchSource: (source: CameraSource) => void;
  toggleMirror: () => void;
  captureFrame: () => string | null;
}

const initialState: CameraState = {
  stream: null,
  devices: [],
  activeDevice: null,
  source: 'webcam',
  isMirrored: true,
  permissionStatus: 'prompt',
  isLoading: false,
  error: null,
};

function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'SET_STREAM':
      return { ...state, stream: action.payload };
    case 'SET_DEVICES':
      return { ...state, devices: action.payload };
    case 'SET_ACTIVE_DEVICE':
      return { ...state, activeDevice: action.payload };
    case 'SET_SOURCE':
      return { ...state, source: action.payload };
    case 'TOGGLE_MIRROR':
      return { ...state, isMirrored: !state.isMirrored };
    case 'SET_PERMISSION':
      return { ...state, permissionStatus: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const CameraContext = createContext<CameraContextValue | null>(null);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cameraReducer, initialState);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices: CameraDevice[] = allDevices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
        }));
      dispatch({ type: 'SET_DEVICES', payload: videoDevices });
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      dispatch({ type: 'SET_STREAM', payload: null });
    }
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      if (state.source !== 'webcam' && state.source !== 'hdmi') {
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      stopCamera();

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
        dispatch({ type: 'SET_STREAM', payload: mediaStream });
        dispatch({ type: 'SET_PERMISSION', payload: 'granted' });

        // Set active device
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) {
            dispatch({ type: 'SET_ACTIVE_DEVICE', payload: settings.deviceId });
          }
        }

        await refreshDevices();
      } catch (err) {
        const error = err as Error;

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          dispatch({ type: 'SET_PERMISSION', payload: 'denied' });
          dispatch({
            type: 'SET_ERROR',
            payload: 'Camera permission denied. Please allow camera access.',
          });
        } else if (error.name === 'NotFoundError') {
          dispatch({
            type: 'SET_ERROR',
            payload: 'No camera found. Please connect a camera.',
          });
        } else if (error.name === 'NotReadableError') {
          dispatch({
            type: 'SET_ERROR',
            payload: 'Camera is in use by another application.',
          });
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: `Failed to access camera: ${error.message}`,
          });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.source, stopCamera, refreshDevices]
  );

  const switchDevice = useCallback(
    async (deviceId: string) => {
      await startCamera(deviceId);
    },
    [startCamera]
  );

  const switchSource = useCallback((source: CameraSource) => {
    dispatch({ type: 'SET_SOURCE', payload: source });
  }, []);

  const toggleMirror = useCallback(() => {
    dispatch({ type: 'TOGGLE_MIRROR' });
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (state.isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/png');
  }, [state.isMirrored]);

  // Handle device changes
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const value: CameraContextValue = {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    switchDevice,
    switchSource,
    toggleMirror,
    captureFrame,
  };

  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}
