import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';

const defaultFormatter = (val) => Math.round(val).toLocaleString();

export function AnimatedCounter({ value, duration = 0.8, prefix = '', suffix = '', formatter = defaultFormatter }) {
  const count = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(formatter(value));
  const isFirstRender = useRef(true);

  useEffect(() => {
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
  }, [value, duration, count, formatter]);

  return <span>{prefix}{displayValue}{suffix}</span>;
}
