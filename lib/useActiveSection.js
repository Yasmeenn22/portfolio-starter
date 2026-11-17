"use client";

import { useEffect, useState } from "react";
import { SECTIONS } from "@/lib/sections";

// The section whose top has passed 35% of the screen is the current one (scroll-spy).
export function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    let raf = 0;
    const els = () => SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    function update() {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let current = "";
      for (const el of els()) if (el.getBoundingClientRect().top <= line) current = el.id;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atEnd) current = els().at(-1)?.id || current;
      setActive(current);
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return active;
}
