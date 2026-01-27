'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCountdownOptions {
  duration: number;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseCountdownReturn {
  remaining: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useCountdown(options: UseCountdownOptions): UseCountdownReturn {
  const { duration, onComplete, onTick } = options;

  const [remaining, setRemaining] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setRemaining(duration);
  }, [stop, duration]);

  const start = useCallback(() => {
    // Reset before starting
    setRemaining(duration);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const newValue = prev - 1;

        if (newValue <= 0) {
          stop();
          onCompleteRef.current?.();
          return 0;
        }

        onTickRef.current?.(newValue);
        return newValue;
      });
    }, 1000);
  }, [duration, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update remaining when duration changes (and not running)
  useEffect(() => {
    if (!isRunning) {
      setRemaining(duration);
    }
  }, [duration, isRunning]);

  return {
    remaining,
    isRunning,
    start,
    stop,
    reset,
  };
}
