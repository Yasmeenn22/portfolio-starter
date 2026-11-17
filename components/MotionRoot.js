"use client";

import { useEffect } from "react";

// Scroll reveal and heading reveal. Nothing is hidden until this runs: it adds
// html.motion-ok only when the visitor allows motion, then reveals [data-reveal]
// and [data-split] elements once each as they enter the screen (at least 6% visible),
// staggered by 55ms in reading order, at most 14 steps.
export default function MotionRoot() {
  useEffect(() => {
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting);
        shown.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left,
        );
        shown.forEach((e, i) => {
          if (e.target.hasAttribute("data-reveal")) e.target.style.setProperty("--d", `${Math.min(i, 14) * 55}ms`);
          e.target.setAttribute("data-in", ""); // an attribute React never manages, so re-renders keep it
          io.unobserve(e.target);
        });
      },
      { threshold: 0.06 },
    );
    const PENDING = "[data-reveal]:not([data-in]), [data-split]:not([data-in]), [data-draw]:not([data-in])";
    const watch = (root) => {
      root.querySelectorAll?.(PENDING).forEach((el) => io.observe(el));
      if (root.matches?.(PENDING)) io.observe(root);
    };
    // Anything the visitor has already scrolled past (a fast scroll, a jump to #contact)
    // simply shows, without animating, so nothing above the screen can stay hidden.
    let raf = 0;
    const settlePassed = () => {
      raf = 0;
      const passed = [...document.querySelectorAll(PENDING)].filter((el) => el.getBoundingClientRect().bottom < 0 && el.offsetParent !== null);
      for (const el of passed) {
        el.setAttribute("data-in", "instant");
        io.unobserve(el);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(settlePassed);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // What is already on screen when the script starts simply stays visible (it was painted
    // before hydration, and hiding it would only delay the page). Only content below animates in.
    const onScreen = [...document.querySelectorAll(PENDING)].filter((el) => el.getBoundingClientRect().top < innerHeight);
    for (const el of onScreen) el.setAttribute("data-in", "instant");
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
    // Cards added later (a filter, a tab) are revealed the same way.
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
      document.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(spotRaf);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      mo.disconnect();
      reduced.removeEventListener("change", onChange);
      html.classList.remove("motion-ok");
    };
  }, []);
  return null;
}
