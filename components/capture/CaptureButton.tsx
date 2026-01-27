'use client';

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { captureButtonVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';

interface CaptureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isCapturing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

const iconSizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export function CaptureButton({
  onClick,
  disabled = false,
  isCapturing = false,
  size = 'lg',
  className,
}: CaptureButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isCapturing}
      variants={captureButtonVariants}
      initial="idle"
      whileTap="pressed"
      animate={isCapturing ? 'idle' : 'pulse'}
      className={cn(
        sizeClasses[size],
        'relative rounded-full bg-white',
        'flex items-center justify-center',
        'shadow-lg shadow-black/30',
        'transition-opacity',
        'focus:outline-none focus:ring-4 focus:ring-white/50',
        'touch-manipulation',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        // Ensure 64px+ touch target for accessibility
        minWidth: '64px',
        minHeight: '64px',
      }}
    >
      {/* Outer ring */}
      <span
        className={cn(
          'absolute inset-1 rounded-full border-4 border-zinc-800',
          isCapturing && 'animate-pulse'
        )}
      />

      {/* Inner button */}
      <span
        className={cn(
          'absolute inset-3 rounded-full bg-red-500',
          'transition-all duration-150',
          !disabled && !isCapturing && 'hover:bg-red-600'
        )}
      />

      {/* Icon */}
      <Camera
        className={cn(
          iconSizeClasses[size],
          'relative z-10 text-white'
        )}
      />

      {/* Capturing indicator */}
      {isCapturing && (
        <motion.span
          className="absolute inset-0 rounded-full border-4 border-white"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}
