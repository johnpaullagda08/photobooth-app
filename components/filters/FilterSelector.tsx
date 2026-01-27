'use client';

import { motion } from 'framer-motion';
import { selectorItemVariants, staggerContainerVariants, staggerChildVariants } from '@/components/animations/variants';
import { cn } from '@/lib/utils';
import { FILTERS } from '@/constants/config';

interface FilterSelectorProps {
  selectedFilter: string;
  onSelectFilter: (filterId: string) => void;
  previewImage?: string;
  className?: string;
}

export function FilterSelector({
  selectedFilter,
  onSelectFilter,
  previewImage,
  className,
}: FilterSelectorProps) {
  // Default preview image if none provided
  const preview = previewImage || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23888" width="100" height="100"/></svg>';

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={cn('flex flex-col gap-3', className)}
    >
      <label className="text-sm font-medium text-zinc-400">Filter</label>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {FILTERS.map((filter) => (
          <motion.button
            key={filter.id}
            variants={staggerChildVariants}
            onClick={() => onSelectFilter(filter.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg',
              'transition-all border-2',
              selectedFilter === filter.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-transparent hover:bg-zinc-800'
            )}
          >
            {/* Filter preview thumbnail */}
            <motion.div
              variants={selectorItemVariants}
              animate={selectedFilter === filter.id ? 'selected' : 'unselected'}
              className={cn(
                'w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden',
                'bg-zinc-800'
              )}
            >
              <img
                src={preview}
                alt={filter.name}
                className="w-full h-full object-cover"
                style={{ filter: filter.cssFilter }}
              />
            </motion.div>

            {/* Filter name */}
            <span
              className={cn(
                'text-xs font-medium truncate max-w-full',
                selectedFilter === filter.id
                  ? 'text-blue-400'
                  : 'text-zinc-400'
              )}
            >
              {filter.name}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
