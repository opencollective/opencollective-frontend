import type { MotionValue } from 'framer-motion';
import { useScroll, useTransform } from 'framer-motion';
import { useEffect, useState, type RefObject } from 'react';

/**
 * Produces smooth scroll shadow opacity values for a horizontally scrollable container,
 * using framer-motion's `useScroll` and `useTransform`. Returns a style object with CSS
 * custom properties that can be spread onto a `motion.div`.
 *
 * The CSS custom properties are:
 * - `--scroll-shadow-left`: opacity (0–0.06) for the left-edge shadow (content scrolled past on the left)
 * - `--scroll-shadow-right`: opacity (0–0.06) for the right-edge shadow (content extending past the right)
 *
 * These are consumed by `.inset-scroll-shadow`, `.sticky-col-scroll-shadow-left`,
 * and `.sticky-col-scroll-shadow-right` in the CSS.
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
    return () => observer.disconnect();
  }, [ref]);

  return {
    '--scroll-shadow-left': hasOverflow ? scrollShadowLeft : 0,
    '--scroll-shadow-right': hasOverflow ? scrollShadowRight : 0,
  };
}
