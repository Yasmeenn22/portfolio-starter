"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";

// A scroll-snap carousel: native touch swipe, plus mouse drag, previous/next buttons,
// dots and the arrow keys. The centred photo is full size; neighbours peek in smaller.
// It runs right to left in Arabic because the track inherits dir="rtl". No autoplay.
export default function Gallery({ lang, photos }) {
  const t = getUi(lang).gallery;
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const drag = useRef(null);

  const slides = () => [...(trackRef.current?.children || [])];

  const go = useCallback((i, smooth = true) => {
    const list = slides();
    const n = Math.max(0, Math.min(list.length - 1, i));
    const track = trackRef.current;
    const s = list[n];
    if (!track || !s) return;
    // centre the slide inside the track without scrolling the page
    const left = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
    track.scrollTo({ left, behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
  }, []);

  // Which slide is closest to the centre.
  useEffect(() => {
    const track = trackRef.current;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      slides().forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setIndex(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Mouse drag (touch already scrolls natively).
  function onPointerDown(e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false };
    trackRef.current.setPointerCapture(e.pointerId);
    trackRef.current.dataset.dragging = "true";
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    trackRef.current.scrollLeft = d.left - dx;
  }
  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    delete trackRef.current.dataset.dragging;
    go(index);
  }

  function onKeyDown(e) {
    const next = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    const prev = lang === "ar" ? "ArrowRight" : "ArrowLeft";
    if (e.key === next) {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === prev) {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(photos.length - 1);
    }
  }

  return (
    <div className="mt-8" role="region" aria-roledescription="carousel" aria-label={t.label}>
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[11%] px-[11%] pb-2 [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none data-[dragging=true]:select-none [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((p, i) => (
          <div
            key={p.file}
            role="group"
            aria-roledescription="slide"
            aria-label={t.slide(i + 1, photos.length)}
            aria-hidden={i !== index ? "true" : undefined}
            className={`w-[78%] shrink-0 snap-center transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] md:w-[70%] ${
              i === index ? "" : "scale-[.92]"
            }`}
          >
            <div className={`relative aspect-[16/9] overflow-hidden rounded-[var(--radius)] bg-surface-2 ring-1 ring-line transition-opacity duration-500 ${i === index ? "" : "opacity-55"}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1120px) 790px, 78vw" draggable={false} className="pointer-events-none object-cover" />
            </div>
            <p className="mt-3 text-[15px] leading-snug text-muted">{bidi(p.caption, lang)}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button type="button" className="btn btn-icon" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t.prev}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flip-rtl"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <div className="flex items-center gap-1">
          {photos.map((p, i) => (
            <button
              key={p.file}
              type="button"
              onClick={() => go(i)}
              aria-label={t.goTo(i + 1)}
              aria-current={i === index ? "true" : undefined}
              className="grid size-7 place-items-center"
            >
              <span aria-hidden="true" className={`block h-2 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-accent" : "w-2 bg-line"}`} />
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-icon" onClick={() => go(index + 1)} disabled={index === photos.length - 1} aria-label={t.next}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flip-rtl"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {t.slide(index + 1, photos.length)}
      </p>
    </div>
  );
}
