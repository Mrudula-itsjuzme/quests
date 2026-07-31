/**
 * Reusable Motion Variants and Easing Curves
 * Inspired by Linear, Apple HIG, Raycast, and Superhuman
 */

export const appleEase = [0.16, 1, 0.3, 1]; // Apple HIG spring ease curve
export const linearEase = [0.22, 1, 0.36, 1];

export const springConfig = {
  soft: { type: 'spring', stiffness: 260, damping: 24 },
  snappy: { type: 'spring', stiffness: 450, damping: 30 },
  bouncy: { type: 'spring', stiffness: 500, damping: 22 },
  tactile: { type: 'spring', stiffness: 600, damping: 35 },
};

export const staggerContainer = (staggerChildren = 0.04, delayChildren = 0) => ({
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
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: appleEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const fadeInScale = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: appleEase },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: appleEase },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};
