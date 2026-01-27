'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFullscreen } from '@/hooks/useFullscreen';

interface FullscreenToggleProps {
  className?: string;
  targetRef?: React.RefObject<HTMLElement | null>;
  label?: string;
}

export function FullscreenToggle({ className, targetRef, label }: FullscreenToggleProps) {
  const { isFullscreen, isSupported, toggle, ref } = useFullscreen();

  // Sync the target ref if provided
  useEffect(() => {
    if (targetRef?.current) {
      (ref as React.MutableRefObject<HTMLElement | null>).current = targetRef.current;
    }
  }, [targetRef, ref]);

  if (!isSupported) {
    return null;
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg',
        'bg-zinc-800 text-zinc-300',
        'hover:bg-zinc-700 hover:text-white transition-colors',
        label ? 'px-3 h-10' : 'w-10 h-10',
        className
      )}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <Minimize className="w-5 h-5" />
      ) : (
        <Maximize className="w-5 h-5" />
      )}
      {label && <span className="text-sm font-medium">{label}</span>}
    </motion.button>
  );
}
