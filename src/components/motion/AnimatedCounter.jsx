import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { useMotionReducedPreference } from '../../lib/useMotionPreference';

const defaultFormatter = (val) => Math.round(val).toLocaleString();

export function AnimatedCounter({ value, duration = 0.8, prefix = '', suffix = '', formatter = defaultFormatter }) {
  const count = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(formatter(value));
  const isFirstRender = useRef(true);
  const systemReduced = useReducedMotion();
  const calm = useMotionReducedPreference();
  const reduced = systemReduced || calm;

  useEffect(() => {
    if (reduced) {
      count.set(value);
      setDisplayValue(formatter(value));
      isFirstRender.current = false;
      return;
    }
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // Apple HIG easing
      onUpdate: (latest) => {
        setDisplayValue(formatter(latest));
      },
    });

    return () => controls.stop();
  }, [value, duration, count, formatter, reduced]);

  return <span>{prefix}{reduced ? formatter(value) : displayValue}{suffix}</span>;
}
