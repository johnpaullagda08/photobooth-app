'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { countdownVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  count: number;
  isActive: boolean;
  className?: string;
}

export function CountdownTimer({ count, isActive, className }: CountdownTimerProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-black/60 z-20',
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          variants={countdownVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex items-center justify-center"
        >
          <span className="text-white font-bold text-[12rem] leading-none tabular-nums drop-shadow-2xl">
            {count}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Progress ring */}
      <svg
        className="absolute w-64 h-64"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="4"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={283}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 283 }}
          transition={{ duration: 1, ease: 'linear' }}
          key={count}
          style={{
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>
    </div>
  );
}
