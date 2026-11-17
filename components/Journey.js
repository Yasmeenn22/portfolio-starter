"use client";

import { useEffect, useRef } from "react";
import { bidi } from "@/lib/bidi";
import { openTarget } from "@/lib/reveal";

// A vertical line whose accent fill grows with the scroll:
// fill = clamp((viewportHeight × 0.62 − timelineTop) / timelineHeight, 0, 1).
// A milestone dot fills (and scales to 1.15) once it passes that 62% line.
export default function Journey({ items, lang, now, openLabel }) {
  const listRef = useRef(null);
  const fillRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      if (!list) return;
      const line = window.innerHeight * 0.62;
      const r = list.getBoundingClientRect();
      const fill = reduced ? 1 : Math.min(1, Math.max(0, (line - r.top) / r.height));
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${fill.toFixed(4)})`;
      for (const li of list.children) {
        const dot = li.querySelector("[data-dot]");
        if (dot) dot.dataset.passed = reduced || li.getBoundingClientRect().top + 14 < line ? "true" : "false";
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative mt-8">
      {/* the line, and its fill growing from the top */}
      <span aria-hidden="true" className="absolute start-[11px] top-2 bottom-2 w-0.5 rounded bg-line" />
      <span
        ref={fillRef}
        aria-hidden="true"
        className="absolute start-[11px] top-2 bottom-2 w-0.5 origin-top rounded bg-gradient-to-b from-accent to-accent-2"
        style={{ transform: "scaleY(0)" }}
      />
      <ol ref={listRef} className="relative grid gap-1">
        {items.map((m, i) => {
          const id = m.href.slice(1);
          return (
            <li key={i} className="relative ps-10">
              {m.current ? (
                <span aria-hidden="true" className="absolute start-[4px] top-[18px] size-4 animate-[pulse-ring_2s_ease-out_infinite] rounded-full bg-accent" />
              ) : null}
              <span
                data-dot=""
                data-current={m.current ? "true" : undefined}
                aria-hidden="true"
                className="absolute start-[4px] top-[18px] size-4 rounded-full border-[3px] border-accent bg-bg transition-[transform,background-color] duration-300 data-[passed=true]:scale-[1.15] data-[passed=true]:bg-accent"
              />
              <a
                href={m.href}
                onClick={(e) => openTarget(id, e)}
                className="block rounded-[12px] px-3 py-3 text-ink no-underline transition-colors hover:bg-surface"
              >
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[13px] font-bold tabular-nums text-accent">{m.when}</span>
                  {m.current ? <span className="badge badge-accent">{now}</span> : null}
                </span>
                <span className="mt-0.5 block font-semibold leading-snug">{bidi(m.title, lang)}</span>
                <span className="mt-0.5 block text-[15px] text-muted">{bidi(m.text, lang)}</span>
                <span className="sr-only">. {openLabel}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
