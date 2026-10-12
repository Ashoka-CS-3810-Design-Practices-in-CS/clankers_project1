import { useEffect, useRef } from 'react';

const EDGE_PADDING = 48;

/**
 * Returns a ref for a horizontally scrollable canvas and keeps position `x` inside it visible.
 * Trees and heaps are often wider than a phone screen; without this the root or the node
 * being compared can start off-screen. The container only scrolls when `x` is actually out
 * of view, so a learner who has scrolled elsewhere is not moved on every step.
 */
export function useKeepInView<T extends HTMLElement>(x: number | null) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || x === null) return;
    const left = element.scrollLeft;
    const width = element.clientWidth;
    if (width === 0) return;
    if (x < left + EDGE_PADDING || x > left + width - EDGE_PADDING) {
      element.scrollLeft = Math.max(0, x - width / 2);
    }
  }, [x]);
  return ref;
}
