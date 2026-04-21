import { type RefObject, useEffect, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import { useScroll, useTransform } from 'framer-motion';

/**
 * Returns `--scroll-shadow-left` and `--scroll-shadow-right` CSS custom properties
 * (opacity 0–0.06) for a horizontally scrollable `motion.div`.
 */
export function useScrollShadow(ref: RefObject<HTMLElement | null>): Record<string, MotionValue<number> | number> {
  const { scrollXProgress } = useScroll({ container: ref });
  const [hasOverflow, setHasOverflow] = useState(false);

  const scrollShadowLeft = useTransform(scrollXProgress, [0, 0.02, 1], [0, 0.06, 0.06]);
  const scrollShadowRight = useTransform(scrollXProgress, [0, 0.98, 1], [0.06, 0.06, 0]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    // Also observe the first child so that content-driven width changes
    // (e.g. column visibility toggling) update the overflow state.
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }
    return () => observer.disconnect();
  }, [ref]);

  return {
    '--scroll-shadow-left': hasOverflow ? scrollShadowLeft : 0,
    '--scroll-shadow-right': hasOverflow ? scrollShadowRight : 0,
  };
}
