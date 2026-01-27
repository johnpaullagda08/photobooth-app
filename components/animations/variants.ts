import { Variants } from 'framer-motion';

// Countdown number animation (scale + fade)
export const countdownVariants: Variants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { scale: 1.5, opacity: 0, transition: { duration: 0.3 } },
};

// Photo slot fill animation
export const photoSlotVariants: Variants = {
  empty: { scale: 0.95, opacity: 0.5 },
  filled: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

// Screen transitions (camera → preview → final)
export const screenVariants: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'tween', ease: 'easeOut', duration: 0.3 },
  },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
};

// Slide from left
export const slideFromLeftVariants: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'tween', ease: 'easeOut', duration: 0.3 },
  },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } },
};

// Fade in/out
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

// Scale fade (for modals)
export const scaleFadeVariants: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
};

// Capture button pulse
export const captureButtonVariants: Variants = {
  idle: { scale: 1 },
  pressed: { scale: 0.95, transition: { duration: 0.1 } },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  },
};

// Filter/theme selector item
export const selectorItemVariants: Variants = {
  unselected: { opacity: 0.7, scale: 0.95 },
  selected: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

// Stagger children animation
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerChildVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

// Photo strip entrance
export const photoStripVariants: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      staggerChildren: 0.15,
    },
  },
};

// Flash effect for capture
export const flashVariants: Variants = {
  initial: { opacity: 0 },
  flash: {
    opacity: [0, 1, 0],
    transition: { duration: 0.3, times: [0, 0.1, 1] },
  },
};

// Backdrop animation (for modals)
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Bounce animation
export const bounceVariants: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
};

// Shake animation (for errors)
export const shakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

// Slide up animation
export const slideUpVariants: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

// Pop animation
export const popVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
};
