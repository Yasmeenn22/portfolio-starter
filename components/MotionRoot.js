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
    const PENDING = "[data-reveal]:not([data-in]), [data-split]:not([data-in])";
    const watch = (root) => {
      root.querySelectorAll?.(PENDING).forEach((el) => io.observe(el));
      if (root.matches?.(PENDING)) io.observe(root);
    };
    // Anything the visitor has already scrolled past (a fast scroll, a jump to #contact)
    // simply shows, without animating, so nothing above the screen can stay hidden.
    let raf = 0;
    const settlePassed = () => {
      raf = 0;
      document.querySelectorAll(PENDING).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 && el.offsetParent !== null) {
          el.setAttribute("data-in", "instant");
          io.unobserve(el);
        }
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(settlePassed);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // What is already on screen when the script starts simply stays visible (it was painted
    // before hydration, and hiding it would only delay the page). Only content below animates in.
    document.querySelectorAll(PENDING).forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) el.setAttribute("data-in", "instant");
    });
    html.classList.add("motion-ok");
    watch(document);
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
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      mo.disconnect();
      reduced.removeEventListener("change", onChange);
      html.classList.remove("motion-ok");
    };
  }, []);
  return null;
}
