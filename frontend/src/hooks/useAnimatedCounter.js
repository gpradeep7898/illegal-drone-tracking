import { useState, useEffect, useRef } from 'react';

/**
 * Smoothly animates from previous value to a new target value.
 * Returns the current display integer.
 */
export default function useAnimatedCounter(targetValue, duration = 600) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const prevValue = useRef(targetValue);
  const animationFrame = useRef(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = targetValue;
    const startTime = performance.now();

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}
