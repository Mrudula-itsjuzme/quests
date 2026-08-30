/**
 * Unified Motion System & Easing Curves
 * Inspired by Linear, Apple HIG, Raycast, and Superhuman
 * Optimized for subtle, physical, 60fps performance without visual noise.
 */

export const appleEase = [0.16, 1, 0.3, 1];
export const exitEase = [0.4, 0, 1, 1];

/**
 * Canonical timing scale (seconds, for framer-motion). Mirrors the
 * --duration-* custom properties in index.css so motion authored in JS and in
 * CSS lands on the same values.
 *   micro    — press/hover/icon response, must feel immediate
 *   standard — tabs, cards, sheets, route content
 *   hero     — discovery reveal and other earned, cinematic beats
 */
export const duration = {
  micro: 0.12,
  quick: 0.18,
  standard: 0.24,
  considered: 0.42,
  hero: 0.7,
};
export const linearEase = [0.22, 1, 0.36, 1];

export const springConfig = {
  soft: { type: 'spring', stiffness: 350, damping: 30 },
  snappy: { type: 'spring', stiffness: 700, damping: 30 }, // High frequency: fast & almost invisible
  tactile: { type: 'spring', stiffness: 500, damping: 25 }, // Medium frequency: noticeable physical bounce
  cinematic: { type: 'spring', stiffness: 150, damping: 22 }, // Low frequency: slow, grand, heavy
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

export const calmStaggerContainer = (staggerChildren = 0.08, delayChildren = 0.1) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren, delayChildren },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
});

export const calmFade = {
  hidden: { opacity: 0, filter: 'blur(2px)' },
  show: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: linearEase },
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/**
 * Root-destination transition. Deliberately cheap and quick: root navigation
 * should feel instant, so this animates transform/opacity only (an animated
 * `filter: blur()` here cost a full-screen repaint on every tab change) and
 * exits faster than it enters so the incoming screen is never kept waiting.
 */
export const journalPageTurn = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: appleEase },
  },
  exit: {
    opacity: 0,
    y: -3,
    transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
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
