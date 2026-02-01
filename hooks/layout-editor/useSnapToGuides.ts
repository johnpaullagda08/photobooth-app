import { useCallback, useMemo } from 'react';
import type { BoxConfig } from '@/lib/events/types';

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number; // percentage
  source: 'box-edge' | 'box-center' | 'margin' | 'canvas-center';
  sourceBoxId?: string;
}

interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  activeGuides: SnapGuide[];
}

interface UseSnapToGuidesProps {
  boxes: BoxConfig[];
  activeBoxId: string | null;
  snapThreshold?: number; // in percentage
  marginGuides?: number[]; // margin percentages to snap to
  enabled?: boolean;
}

export function useSnapToGuides({
  boxes,
  activeBoxId,
  snapThreshold = 2,
  marginGuides = [5, 10],
  enabled = true,
}: UseSnapToGuidesProps) {
  // Generate all snap guides from other boxes
  const generateGuides = useCallback((): SnapGuide[] => {
    if (!enabled) return [];

    const guides: SnapGuide[] = [];

    // Canvas center guides
    guides.push({
      type: 'vertical',
      position: 50,
      source: 'canvas-center',
    });
    guides.push({
      type: 'horizontal',
      position: 50,
      source: 'canvas-center',
    });

    // Margin guides
    marginGuides.forEach((margin) => {
      guides.push({ type: 'vertical', position: margin, source: 'margin' });
      guides.push({ type: 'vertical', position: 100 - margin, source: 'margin' });
      guides.push({ type: 'horizontal', position: margin, source: 'margin' });
      guides.push({ type: 'horizontal', position: 100 - margin, source: 'margin' });
    });

    // Box edge and center guides (from other boxes)
    boxes.forEach((box) => {
      if (box.id === activeBoxId) return;

      // Left edge
      guides.push({
        type: 'vertical',
        position: box.x,
        source: 'box-edge',
        sourceBoxId: box.id,
      });

      // Right edge
      guides.push({
        type: 'vertical',
        position: box.x + box.width,
        source: 'box-edge',
        sourceBoxId: box.id,
      });

      // Center X
      guides.push({
        type: 'vertical',
        position: box.x + box.width / 2,
        source: 'box-center',
        sourceBoxId: box.id,
      });

      // Top edge
      guides.push({
        type: 'horizontal',
        position: box.y,
        source: 'box-edge',
        sourceBoxId: box.id,
      });

      // Bottom edge
      guides.push({
        type: 'horizontal',
        position: box.y + box.height,
        source: 'box-edge',
        sourceBoxId: box.id,
      });

      // Center Y
      guides.push({
        type: 'horizontal',
        position: box.y + box.height / 2,
        source: 'box-center',
        sourceBoxId: box.id,
      });
    });

    return guides;
  }, [boxes, activeBoxId, marginGuides, enabled]);

  const guides = useMemo(() => generateGuides(), [generateGuides]);

  // Find nearest snap position for a value
  const findSnapPosition = useCallback(
    (inputValue: number, guideType: 'vertical' | 'horizontal'): { value: number; guide: SnapGuide | null } => {
      const relevantGuides = guides.filter((g) => g.type === guideType);

      let nearestGuide: SnapGuide | null = null;
      let nearestDistance = Infinity;

      for (const guide of relevantGuides) {
        const distance = Math.abs(guide.position - inputValue);
        if (distance < nearestDistance && distance <= snapThreshold) {
          nearestDistance = distance;
          nearestGuide = guide;
        }
      }

      return {
        value: nearestGuide !== null ? nearestGuide.position : inputValue,
        guide: nearestGuide,
      };
    },
    [guides, snapThreshold]
  );

  // Snap a box position during drag
  const snapPosition = useCallback(
    (box: BoxConfig, newX: number, newY: number): SnapResult => {
      if (!enabled) {
        return {
          x: newX,
          y: newY,
          snappedX: false,
          snappedY: false,
          activeGuides: [],
        };
      }

      const activeGuides: SnapGuide[] = [];
      let finalX = newX;
      let finalY = newY;
      let snappedX = false;
      let snappedY = false;

      // Check left edge snap
      const leftSnap = findSnapPosition(newX, 'vertical');
      if (leftSnap.guide) {
        finalX = leftSnap.value;
        snappedX = true;
        activeGuides.push(leftSnap.guide);
      }

      // Check right edge snap
      if (!snappedX) {
        const rightSnap = findSnapPosition(newX + box.width, 'vertical');
        if (rightSnap.guide) {
          finalX = rightSnap.value - box.width;
          snappedX = true;
          activeGuides.push(rightSnap.guide);
        }
      }

      // Check center X snap
      if (!snappedX) {
        const centerXSnap = findSnapPosition(newX + box.width / 2, 'vertical');
        if (centerXSnap.guide) {
          finalX = centerXSnap.value - box.width / 2;
          snappedX = true;
          activeGuides.push(centerXSnap.guide);
        }
      }

      // Check top edge snap
      const topSnap = findSnapPosition(newY, 'horizontal');
      if (topSnap.guide) {
        finalY = topSnap.value;
        snappedY = true;
        activeGuides.push(topSnap.guide);
      }

      // Check bottom edge snap
      if (!snappedY) {
        const bottomSnap = findSnapPosition(newY + box.height, 'horizontal');
        if (bottomSnap.guide) {
          finalY = bottomSnap.value - box.height;
          snappedY = true;
          activeGuides.push(bottomSnap.guide);
        }
      }

      // Check center Y snap
      if (!snappedY) {
        const centerYSnap = findSnapPosition(newY + box.height / 2, 'horizontal');
        if (centerYSnap.guide) {
          finalY = centerYSnap.value - box.height / 2;
          snappedY = true;
          activeGuides.push(centerYSnap.guide);
        }
      }

      return {
        x: finalX,
        y: finalY,
        snappedX,
        snappedY,
        activeGuides,
      };
    },
    [enabled, findSnapPosition]
  );

  // Snap during resize (check edges being resized)
  const snapResize = useCallback(
    (
      box: BoxConfig,
      edge: 'left' | 'right' | 'top' | 'bottom',
      newValue: number
    ): { value: number; guide: SnapGuide | null } => {
      if (!enabled) {
        return { value: newValue, guide: null };
      }

      const guideType = edge === 'left' || edge === 'right' ? 'vertical' : 'horizontal';
      return findSnapPosition(newValue, guideType);
    },
    [enabled, findSnapPosition]
  );

  return {
    guides,
    snapPosition,
    snapResize,
    findSnapPosition,
  };
}
