/**
 * Unified Motion System & Easing Curves
 * Inspired by Linear, Apple HIG, Raycast, and Superhuman
 * Optimized for subtle, physical, 60fps performance without visual noise.
 */

export const appleEase = [0.16, 1, 0.3, 1];
export const linearEase = [0.22, 1, 0.36, 1];

export const springConfig = {
  soft: { type: 'spring', stiffness: 350, damping: 30 },
  snappy: { type: 'spring', stiffness: 500, damping: 32 },
  tactile: { type: 'spring', stiffness: 650, damping: 38 },
};

export const staggerContainer = (staggerChildren = 0.02, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.01, staggerDirection: -1 },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: appleEase },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export const fadeInScale = {
  hidden: { opacity: 0, scale: 0.98, y: 4 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: appleEase },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: appleEase },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};
