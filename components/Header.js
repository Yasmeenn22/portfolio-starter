"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getUi } from "@/data/ui";
import { SECTIONS } from "@/lib/sections";
import { localePath, neutralPath } from "@/lib/paths";
import { withBase } from "@/lib/withBase";
import { useActiveSection } from "@/lib/useActiveSection";
import ThemeToggle from "@/components/ThemeToggle";
import LangSwitch from "@/components/LangSwitch";
import MobileMenu from "@/components/MobileMenu";
import portrait from "@/assets/yara/portrait.jpg";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Sticky bar: brand, section links with one ink pill sliding behind the active link
// (scroll-spy), language switch, theme toggle and Download CV.
export default function Header({ lang, name, cvHref }) {
  const t = getUi(lang);
  const pathname = usePathname();
  const onHome = neutralPath(pathname || "/") === "/";
  const active = useActiveSection();
  const listRef = useRef(null);
  const [pill, setPill] = useState(null);

  const hrefFor = useCallback(
    (id) => (onHome ? `#${id}` : `${withBase(localePath(lang, "/"))}#${id}`),
    [onHome, lang],
  );

  const measure = useCallback(() => {
    const link = listRef.current?.querySelector('[aria-current="true"]');
    if (!link) return setPill(null);
    setPill({ left: link.offsetLeft, width: link.offsetWidth });
  }, []);

  useIsoLayoutEffect(() => {
    measure();
  }, [active, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <header className="sticky top-0 z-50 h-[var(--nav)] border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-[12px]">
      <div className="wrap-wide flex h-full items-center justify-between gap-4">
        <a href={withBase(localePath(lang, "/"))} className="flex min-h-11 min-w-0 items-center gap-3 text-ink no-underline" aria-label={`${name}, ${t.nav.home}`}>
          <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-ink text-[13px] font-bold text-bg">
            <Image src={portrait} alt="" width={36} height={36} className="size-full object-cover" />
          </span>
          <span className="whitespace-nowrap text-[16px] font-semibold tracking-tight xl:max-[1359px]:sr-only">{name}</span>
        </a>

        <nav aria-label={t.nav.label} className="hidden xl:block">
          <ul ref={listRef} className="relative flex items-center gap-0.5">
            {/* the pill: one element, measured from the active link (physical left works in both directions) */}
            <li
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 h-9 -translate-y-1/2 rounded-full bg-ink transition-[left,width,opacity] duration-500 ease-[cubic-bezier(.5,1.3,.45,1)]"
              style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
            />
            {SECTIONS.filter((s) => s.bar).map((s) => (
              <li key={s.id}>
                <a
                  href={hrefFor(s.id)}
                  aria-current={onHome && active === s.id ? "true" : undefined}
                  className="relative flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-[14px] font-medium text-muted no-underline transition-colors duration-[250ms] hover:text-ink aria-[current=true]:text-bg"
                >
                  {t.nav[s.key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LangSwitch lang={lang} className="hidden sm:inline-flex" />
          <ThemeToggle lang={lang} />
          <a href={cvHref} download data-tip="download" className="btn btn-primary hidden md:inline-flex" aria-label={lang === "ar" ? `${t.cv.download} (${t.cv.note})` : undefined}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" /></svg>
            {t.cv.download}
          </a>
          <MobileMenu lang={lang} active={onHome ? active : ""} hrefFor={hrefFor} cvHref={cvHref} />
        </div>
      </div>
    </header>
  );
}
