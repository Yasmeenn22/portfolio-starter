"use client";

import { useLayoutEffect, useRef } from "react";

// When a filter changes, items glide from where they were to where they are now (FLIP),
// and newly shown items fade in. Children opt in with data-flip="<stable id>".
// Positions are measured relative to the container, so scrolling in between does not matter.
function measure(box) {
  const origin = box.getBoundingClientRect();
  const map = new Map();
  for (const el of box.children) {
    if (!el.dataset.flip) continue;
    const r = el.getBoundingClientRect();
    map.set(el.dataset.flip, { x: r.left - origin.left, y: r.top - origin.top });
  }
  return map;
}

export function useFlip(containerRef, key) {
  const rects = useRef(null);
  useLayoutEffect(() => {
    const box = containerRef.current;
    if (!box) return;
    // First render: nothing moves yet. Record the starting places when the browser is idle,
    // so measuring never adds work to the page load.
    if (rects.current === null) {
      rects.current = new Map();
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));
      idle(() => {
        if (containerRef.current) rects.current = measure(containerRef.current);
      });
      return;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const origin = box.getBoundingClientRect();
    const prev = rects.current;
    const next = new Map();
    for (const el of box.children) {
      const id = el.dataset.flip;
      if (!id) continue;
      const r = el.getBoundingClientRect();
      const pos = { x: r.left - origin.left, y: r.top - origin.top };
      next.set(id, pos);
      if (reduce || !el.animate || prev.size === 0) continue;
      const p = prev.get(id);
      if (p) {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" });
      } else {
        el.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 350, easing: "ease-out" });
      }
    }
    rects.current = next;
  }, [containerRef, key]);
}
