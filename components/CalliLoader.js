"use client";

import { useEffect } from "react";
import { calli } from "@/lib/fonts-calli";

// Fetches the calligraphy face only once the page has loaded and painted (it is decoration, so it
// never competes with the text and images people came for), then switches it on: html.calli-ready.
// The pen in the hero starts writing at that moment, just after the rest of the hero has arrived.
// If the font is slow or fails, the name is written in the normal Arabic face after 3 more seconds,
// and a CSS failsafe writes it after 5s even if this script never runs, so it can never stay blank.
export default function CalliLoader() {
  useEffect(() => {
    const html = document.documentElement;
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      html.classList.add("calli-ready");
      html.classList.remove("calli-wait");
    };
    const start = () => {
      if (!document.querySelector(".calli")) return done();
      timer = setTimeout(done, 3000);
      document.fonts?.load(`700 1em ${calli.style.fontFamily}`, "د. يارا").then(done, done) ?? done();
    };
    // after the load event AND the first paint, plus a short idle beat
    let wait = 0;
    let po = null;
    const afterPaint = () => {
      const go = () => (wait = setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 1000 }) : start()), 700));
      if (performance.getEntriesByName("first-contentful-paint").length || !("PerformanceObserver" in window)) return go();
      po = new PerformanceObserver(() => {
        po.disconnect();
        go();
      });
      po.observe({ type: "paint", buffered: true });
    };
    if (document.readyState === "complete") afterPaint();
    else window.addEventListener("load", afterPaint, { once: true });
    return () => {
      clearTimeout(timer);
      clearTimeout(wait);
      po?.disconnect();
      window.removeEventListener("load", afterPaint);
    };
  }, []);
  return null;
}
