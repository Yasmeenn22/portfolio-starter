"use client";

import { useEffect } from "react";

/*
  Scroll motion that replays. Nothing is hidden until this runs: it adds html.motion-ok only when
  the visitor allows motion. One shared IntersectionObserver watches every [data-reveal] (fades and
  rises in), [data-split] (headings, piece by piece), [data-draw] (the ink stroke) and [data-stage]
  (a group whose children animate in CSS: odometer numbers, board pieces, the closing lines).

  - In: once at least 10% of an element is on screen it gets data-in, and data-dir="down" or "up"
    (the way the page was last scrolling). CSS picks the motion from that, so content rises when
    scrolling down and settles from above when scrolling back up. Elements entering together are
    staggered by 55ms in reading order, at most 14 steps.
  - Out: only once it has fully left the screen does it quietly lose data-in, ready to play again.
    The gap between 10% (in) and 0% (out) is the margin that stops flicker at the screen's edge.
  - Never replays: whatever is on screen when the page opens (data-in="instant": it never blinks
    away) and anything inside a <dialog>. The hero's entrance is pure CSS and runs once on load.
*/
const SEL = "[data-reveal], [data-split], [data-draw], [data-stage]";
const IN_RATIO = 0.1;

export default function MotionRoot() {
  useEffect(() => {
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;
    const rtl = html.dir === "rtl";
    // which way the visitor is scrolling (a few pixels of jitter are ignored)
    let dir = "down";
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 2) dir = y < lastY ? "up" : "down";
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight;
        const entering = [];
        for (const e of entries) {
          const el = e.target;
          const state = el.getAttribute("data-in");
          if (!e.isIntersecting) {
            if (state === "") {
              el.removeAttribute("data-in");
              el.removeAttribute("data-dir");
            }
          } else if (state === null && (e.intersectionRatio >= IN_RATIO || e.intersectionRect.height >= vh * 0.25)) {
            entering.push(e);
          }
        }
        // reading order: rows top to bottom, then start to end (right to left in Arabic)
        entering.sort((a, b) => {
          const A = a.boundingClientRect;
          const B = b.boundingClientRect;
          return Math.round(A.top - B.top) || (rtl ? B.right - A.right : A.left - B.left);
        });
        onScroll(); // the observer can report before the scroll event of the same frame
        entering.forEach((e, i) => {
          const el = e.target;
          el.style.setProperty("--d", `${Math.min(i, 14) * 55}ms`);
          el.setAttribute("data-dir", dir);
          el.setAttribute("data-in", ""); // attributes React never manages, so re-renders keep them
        });
      },
      { threshold: [0, IN_RATIO, 0.25] },
    );

    const watch = (root) => {
      const list = [...(root.querySelectorAll?.(SEL) || [])];
      if (root.matches?.(SEL)) list.push(root);
      for (const el of list) if (!el.closest("dialog") && el.getAttribute("data-in") !== "instant") io.observe(el);
    };

    // What is on screen when the script starts simply stays visible, for good (it was painted
    // before hydration, and hiding it would only delay the page). Everything else replays.
    for (const el of document.querySelectorAll(SEL)) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.setAttribute("data-in", "instant");
    }
    html.classList.add("motion-ok");
    watch(document);

    // A soft spotlight follows the pointer inside cards (.spot), fine pointers only.
    let spot = null;
    let spotRaf = 0;
    let last = null;
    const paintSpot = () => {
      spotRaf = 0;
      if (!spot || !last) return;
      const r = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", `${last.x - r.left}px`);
      spot.style.setProperty("--my", `${last.y - r.top}px`);
    };
    const onPointer = (e) => {
      if (e.pointerType !== "mouse") return;
      spot = e.target.closest?.(".spot") || null;
      last = { x: e.clientX, y: e.clientY };
      if (spot && !spotRaf) spotRaf = requestAnimationFrame(paintSpot);
    };
    document.addEventListener("pointermove", onPointer, { passive: true });
    // Cards added later (a filter, a tab, the board's list view) are watched the same way.
    const mo = new MutationObserver((list) => {
      for (const m of list) m.addedNodes.forEach((n) => n.nodeType === 1 && watch(n));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // If the visitor turns on reduced motion mid-visit, everything shows at once.
    const onChange = () => {
      if (reduced.matches) {
        html.classList.remove("motion-ok");
        io.disconnect();
        mo.disconnect();
      }
    };
    reduced.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(spotRaf);
      io.disconnect();
      mo.disconnect();
      reduced.removeEventListener("change", onChange);
      html.classList.remove("motion-ok");
    };
  }, []);
  return null;
}
