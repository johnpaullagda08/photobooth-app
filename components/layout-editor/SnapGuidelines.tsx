'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SnapGuide } from '@/hooks/layout-editor';
import { cn } from '@/lib/utils';

interface SnapGuidelinesProps {
  guides: SnapGuide[];
  activeGuides: SnapGuide[];
  showAll?: boolean;
}

function SnapGuidelinesComponent({ guides, activeGuides, showAll = false }: SnapGuidelinesProps) {
  const guidesToShow = showAll ? guides : activeGuides;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {guidesToShow.map((guide, index) => {
          const isActive = activeGuides.some(
            (ag) => ag.type === guide.type && ag.position === guide.position
          );

          const key = `${guide.type}-${guide.position}-${guide.source}-${index}`;

          if (guide.type === 'vertical') {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute top-0 bottom-0 w-px',
                  isActive
                    ? 'bg-primary'
                    : guide.source === 'canvas-center'
                    ? 'bg-blue-400/30'
                    : guide.source === 'margin'
                    ? 'bg-orange-400/20'
                    : 'bg-muted-foreground/20'
                )}
                style={{ left: `${guide.position}%` }}
              >
                {/* Guide indicator dot */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            );
          }

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute left-0 right-0 h-px',
                isActive
                  ? 'bg-primary'
                  : guide.source === 'canvas-center'
                  ? 'bg-blue-400/30'
                  : guide.source === 'margin'
                  ? 'bg-orange-400/20'
                  : 'bg-muted-foreground/20'
              )}
              style={{ top: `${guide.position}%` }}
            >
              {/* Guide indicator dot */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const SnapGuidelines = memo(SnapGuidelinesComponent);
