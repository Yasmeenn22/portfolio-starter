"use client";

import { useEffect, useRef } from "react";

// Counts a CV number up once when it scrolls into view (1.1s, ease-out).
// Everything around the digits is kept ("40+", "1,400+"), and the final text is the CV text.
export default function CountUp({ value, className = "" }) {
  const ref = useRef(null);
  const barRef = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const m = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!el || !m || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const [, pre, digits, post] = m;
    const target = parseFloat(digits.replace(/,/g, ""));
    const commas = digits.includes(",");
    const format = (n) => pre + (commas ? Math.round(n).toLocaleString("en-US") : String(Math.round(n))) + post;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const k = Math.min(1, (now - start) / 1100);
          el.textContent = k < 1 ? format(target * (1 - Math.pow(1 - k, 3))) : value;
          if (k < 1) raf = requestAnimationFrame(tick);
          else barRef.current?.setAttribute("data-done", "");
        };
        el.textContent = format(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    const bar = barRef.current;
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = value;
      bar?.setAttribute("data-done", "");
    };
  }, [value]);
  return (
    <span className="flex flex-col items-start gap-2">
      <span ref={ref} dir="ltr" className={`inline-block tabular-nums ${className}`}>
        {value}
      </span>
      <span ref={barRef} aria-hidden="true" className="count-bar" />
    </span>
  );
}
