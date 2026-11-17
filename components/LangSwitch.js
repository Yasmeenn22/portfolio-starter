"use client";

import { usePathname } from "next/navigation";
import { getUi } from "@/data/ui";
import { localePath, neutralPath } from "@/lib/paths";
import { withBase } from "@/lib/withBase";

// Goes to the same page in the other language and keeps the current section (#hash).
export function otherLangHref(lang, pathname) {
  const other = lang === "ar" ? "en" : "ar";
  return withBase(localePath(other, neutralPath(pathname || "/")));
}

export function goToOtherLang(lang, pathname) {
  window.location.href = otherLangHref(lang, pathname) + window.location.hash;
}

export default function LangSwitch({ lang, className = "" }) {
  const pathname = usePathname();
  const t = getUi(lang).lang;
  return (
    <a
      href={otherLangHref(lang, pathname)}
      hrefLang={t.switchLang}
      lang={t.switchLang}
      aria-label={t.switchAria}
      data-tip="language"
      onClick={(e) => {
        e.preventDefault();
        goToOtherLang(lang, pathname);
      }}
      className={`btn ${className}`}
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
      </svg>
      <span>{t.switchTo}</span>
    </a>
  );
}
