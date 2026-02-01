import { useCallback, useMemo } from 'react';
import type { BoxConfig } from '@/lib/events/types';

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  type: 'overlap' | 'boundary' | 'size';
  boxIds: string[];
  message: string;
}

interface UseLayoutValidationProps {
  boxes: BoxConfig[];
  minBoxSize?: number; // minimum size in percentage
}

export function useLayoutValidation({ boxes, minBoxSize = 10 }: UseLayoutValidationProps) {
  // Check if two boxes overlap
  const checkOverlap = useCallback((box1: BoxConfig, box2: BoxConfig): boolean => {
    const box1Right = box1.x + box1.width;
    const box1Bottom = box1.y + box1.height;
    const box2Right = box2.x + box2.width;
    const box2Bottom = box2.y + box2.height;

    // Check if boxes don't overlap (any of these means no overlap)
    const noOverlap =
      box1.x >= box2Right || // box1 is to the right of box2
      box2.x >= box1Right || // box2 is to the right of box1
      box1.y >= box2Bottom || // box1 is below box2
      box2.y >= box1Bottom;   // box2 is below box1

    return !noOverlap;
  }, []);

  // Check if a box is within canvas boundaries
  const checkBoundary = useCallback((box: BoxConfig): boolean => {
    return (
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= 100 &&
      box.y + box.height <= 100
    );
  }, []);

  // Check if box meets minimum size requirement
  const checkMinSize = useCallback((box: BoxConfig): boolean => {
    return box.width >= minBoxSize && box.height >= minBoxSize;
  }, [minBoxSize]);

  // Find all overlapping box pairs
  const findOverlaps = useCallback((boxList: BoxConfig[]): [string, string][] => {
    const overlaps: [string, string][] = [];

    for (let i = 0; i < boxList.length; i++) {
      for (let j = i + 1; j < boxList.length; j++) {
        if (checkOverlap(boxList[i], boxList[j])) {
          overlaps.push([boxList[i].id, boxList[j].id]);
        }
      }
    }

    return overlaps;
  }, [checkOverlap]);

  // Validate entire layout
  const validateLayout = useCallback((): ValidationResult => {
    const errors: ValidationError[] = [];

    // Check for overlaps
    const overlaps = findOverlaps(boxes);
    overlaps.forEach(([id1, id2]) => {
      errors.push({
        type: 'overlap',
        boxIds: [id1, id2],
        message: 'Photo boxes cannot overlap',
      });
    });

    // Check boundaries
    boxes.forEach((box) => {
      if (!checkBoundary(box)) {
        errors.push({
          type: 'boundary',
          boxIds: [box.id],
          message: `${box.label} is outside the canvas boundary`,
        });
      }
    });

    // Check minimum size
    boxes.forEach((box) => {
      if (!checkMinSize(box)) {
        errors.push({
          type: 'size',
          boxIds: [box.id],
          message: `${box.label} is too small (minimum ${minBoxSize}%)`,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [boxes, findOverlaps, checkBoundary, checkMinSize, minBoxSize]);

  // Validate a single box against others
  const validateBox = useCallback((box: BoxConfig, otherBoxes: BoxConfig[]): ValidationResult => {
    const errors: ValidationError[] = [];

    // Check boundary
    if (!checkBoundary(box)) {
      errors.push({
        type: 'boundary',
        boxIds: [box.id],
        message: 'Box is outside canvas boundary',
      });
    }

    // Check minimum size
    if (!checkMinSize(box)) {
      errors.push({
        type: 'size',
        boxIds: [box.id],
        message: `Box is too small (minimum ${minBoxSize}%)`,
      });
    }

    // Check overlaps with other boxes
    otherBoxes.forEach((other) => {
      if (other.id !== box.id && checkOverlap(box, other)) {
        errors.push({
          type: 'overlap',
          boxIds: [box.id, other.id],
          message: 'Boxes cannot overlap',
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [checkBoundary, checkMinSize, checkOverlap, minBoxSize]);

  // Correct a box position to be within boundaries
  const correctBoundary = useCallback((box: BoxConfig): BoxConfig => {
    let { x, y, width, height } = box;

    // Ensure minimum size
    width = Math.max(width, minBoxSize);
    height = Math.max(height, minBoxSize);

    // Correct x position
    if (x < 0) x = 0;
    if (x + width > 100) x = 100 - width;

    // Correct y position
    if (y < 0) y = 0;
    if (y + height > 100) y = 100 - height;

    return { ...box, x, y, width, height };
  }, [minBoxSize]);

  // Get IDs of all boxes that have errors
  const errorBoxIds = useMemo(() => {
    const result = validateLayout();
    const ids = new Set<string>();
    result.errors.forEach((error) => {
      error.boxIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [validateLayout]);

  // Get overlapping box IDs specifically
  const overlappingBoxIds = useMemo(() => {
    const overlaps = findOverlaps(boxes);
    const ids = new Set<string>();
    overlaps.forEach(([id1, id2]) => {
      ids.add(id1);
      ids.add(id2);
    });
    return ids;
  }, [boxes, findOverlaps]);

  return {
    validateLayout,
    validateBox,
    checkOverlap,
    checkBoundary,
    correctBoundary,
    errorBoxIds,
    overlappingBoxIds,
    findOverlaps,
  };
}
