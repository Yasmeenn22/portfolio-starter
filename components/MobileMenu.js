"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getUi } from "@/data/ui";
import { SECTIONS } from "@/lib/sections";
import LangSwitch from "@/components/LangSwitch";

// Below 1280px: a button that opens a full-screen list of every section.
// Closes on a link click and on Escape, keeps Tab inside, and returns focus to the button.
const noop = () => () => {};

export default function MobileMenu({ lang, active, hrefFor, cvHref }) {
  const t = getUi(lang);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  // true once in the browser (the panel is portalled into <body>)
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("a")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = [buttonRef.current, ...panelRef.current.querySelectorAll("a, button")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    const wide = window.matchMedia("(min-width: 80rem)");
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
        className="btn btn-icon relative z-[2]"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-5">
          <span className={`absolute start-0 top-0 h-0.5 w-5 rounded bg-current transition-transform duration-200 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`absolute start-0 top-1.5 h-0.5 w-5 rounded bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute start-0 top-3 h-0.5 w-5 rounded bg-current transition-transform duration-200 ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </span>
      </button>
      {mounted
        ? createPortal(
      <nav
        id="site-menu"
        ref={panelRef}
        hidden={!open}
        aria-label={t.nav.sections}
        className="fixed inset-x-0 bottom-0 top-[var(--nav)] z-[55] overflow-y-auto border-t border-line bg-bg xl:hidden"
      >
        <ul className="wrap py-4">
          {SECTIONS.filter((s) => s.key).map((s) => (
            <li key={s.id} className="border-b border-line">
              <a
                href={hrefFor(s.id)}
                onClick={() => setOpen(false)}
                aria-current={active === s.id ? "true" : undefined}
                className="flex min-h-14 items-center text-[22px] font-semibold tracking-tight text-ink no-underline aria-[current=true]:text-accent"
              >
                {t.nav[s.key]}
              </a>
            </li>
          ))}
        </ul>
        <div className="wrap flex flex-col gap-3 pb-10 sm:flex-row">
          <a href={cvHref} download className="btn btn-primary">
            {t.cv.download}
            {lang === "ar" ? <span className="text-[13px] font-medium opacity-80">({t.cv.note})</span> : null}
          </a>
          <LangSwitch lang={lang} className="sm:hidden" />
        </div>
      </nav>,
            document.body,
          )
        : null}
    </div>
  );
}
