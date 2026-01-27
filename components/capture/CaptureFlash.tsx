'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { flashVariants } from '@/components/animations/variants';

interface CaptureFlashProps {
  isFlashing: boolean;
}

export function CaptureFlash({ isFlashing }: CaptureFlashProps) {
  return (
    <AnimatePresence>
      {isFlashing && (
        <motion.div
          variants={flashVariants}
          initial="initial"
          animate="flash"
          exit="initial"
          className="absolute inset-0 bg-white z-30 pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}
