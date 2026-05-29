import { useEffect, useState } from 'react';

/**
 * Detects mobile virtual keyboard via visualViewport.
 * Returns true when keyboard is likely visible.
 */
export function useKeyboardOpen(threshold = 150): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const detect = () => {
      const diff = window.innerHeight - vv.height;
      setOpen(diff > threshold);
    };

    detect();
    vv.addEventListener('resize', detect);
    vv.addEventListener('scroll', detect);
    return () => {
      vv.removeEventListener('resize', detect);
      vv.removeEventListener('scroll', detect);
    };
  }, [threshold]);

  return open;
}

/**
 * Returns the current visualViewport height (sync with keyboard).
 * Falls back to window.innerHeight.
 */
export function useViewportHeight(): number {
  const [h, setH] = useState(() =>
    typeof window === 'undefined'
      ? 800
      : window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    const update = () => setH(vv?.height ?? window.innerHeight);
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
    };
  }, []);

  return h;
}
