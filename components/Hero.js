import Image from "next/image";
import { getCv, cvEn } from "@/data/cv";
import { getUi } from "@/data/ui";
import { cvHref } from "@/lib/paths";
import { bidi, Ltr } from "@/lib/bidi";
import LinkIcon from "@/components/LinkIcon";
import HeroParallax from "@/components/HeroParallax";
import portrait from "@/assets/yara/portrait.jpg";

/*
  The hero carries the signature, "designs in two directions" (her Riyadh Tech Review cover story):
  her English name arrives from the left and her Arabic name from the right, on both pages, and a
  thin line grows between them in both directions. The entrance is pure CSS and runs once on load.
*/
export default function Hero({ lang }) {
  const cv = getCv(lang);
  const t = getUi(lang);
  const ar = lang === "ar";
  // a non-breaking hyphen keeps "Al-Mansouri" on one line (display only)
  const english = cvEn.name.replace("-", "‑");
  const arabic = ar ? cv.name : cvEn.nameAr;

  const englishName = (
    <span lang="en" dir="ltr" className="hero-from-left block" style={{ "--hd": "150ms" }}>
      {english}
    </span>
  );
  const arabicName = (
    <span lang="ar" dir="rtl" className="hero-from-right block" style={{ "--hd": "300ms" }}>
      {arabic}
    </span>
  );

  return (
    <section id="top" aria-labelledby="top-title" data-tip="top" className="relative isolate overflow-hidden pb-20 pt-10 md:pb-24 md:pt-16">
      {/* a quiet design-system grid, with a few "tokens" on it */}
      <div className="hero-grid" aria-hidden="true">
        <span className="hero-token end-[18%] top-[22%] bg-accent opacity-40" />
        <span className="hero-token end-[30%] top-[58%] bg-accent-2 opacity-40" />
        <span className="hero-token end-[9%] top-[70%] bg-accent opacity-25" />
      </div>
      <HeroParallax />

      <div className="wrap">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:gap-12">
          <div data-parallax="" className="relative size-32 shrink-0 md:size-[200px]">
            <svg className="portrait-frame pointer-events-none absolute -inset-3 size-[calc(100%+24px)]" viewBox="0 0 224 224" aria-hidden="true">
              <rect pathLength="1" x="1" y="1" width="222" height="222" rx="40" />
              <rect pathLength="1" x="7" y="7" width="210" height="210" rx="36" opacity="0.5" />
            </svg>
            <div className="relative size-full overflow-hidden rounded-[24px] shadow-[var(--shadow)] ring-1 ring-line md:rounded-[32px]">
              <Image src={portrait} alt={t.hero.portraitAlt} width={200} height={200} priority sizes="(min-width: 768px) 200px, 128px" className="size-full object-cover" />
              <span className="portrait-cover" aria-hidden="true" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow hero-in flex items-center gap-2" style={{ "--hd": "50ms" }}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {cv.location}
            </p>

            {/* the page's own language is the heading; the other name sits on the far side */}
            <h1 id="top-title" className="h1 mt-3">
              {ar ? arabicName : englishName}
            </h1>
            <div className="mt-4 flex flex-col gap-3">
              <span className="two-way" aria-hidden="true" />
              <p className="text-end text-[clamp(1.3rem,2.6vw,1.9rem)] font-semibold leading-tight text-muted">
                <span className="sr-only">{t.hero.otherName}: </span>
                {ar ? englishName : arabicName}
              </p>
            </div>

            <ul className="hero-in mt-5 flex flex-col gap-1 text-[17px] font-semibold sm:flex-row sm:flex-wrap sm:gap-x-3 md:text-[19px]" style={{ "--hd": "500ms" }}>
              {cv.headline.map((h, i) => (
                <li key={h} className="flex items-center gap-3">
                  {i > 0 ? (
                    <span aria-hidden="true" className="hidden text-accent-2 sm:inline">
                      |
                    </span>
                  ) : null}
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="lead hero-lift mt-8 max-w-[52ch] text-[1.25rem] !text-ink" style={{ "--hd": "600ms" }}>
          {cv.heroLine}
        </p>
        <div className="hero-in mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--hd": "750ms" }}>
          <a href="#projects" className="btn btn-primary">
            {t.hero.viewWork}
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flip-rtl">
              <path d="M5 12h14m0 0-6-6m6 6-6 6" />
            </svg>
          </a>
          <a href={cvHref(cv)} download className="btn">
            {t.cv.download}
            {ar ? <span className="text-[13px] font-medium text-muted">({t.cv.note})</span> : null}
          </a>
        </div>

        <ul aria-label={t.hero.profiles} className="hero-in mt-10 flex flex-wrap gap-2" style={{ "--hd": "900ms" }}>
          {cv.links.map((l) => (
            <li key={l.key}>
              <a href={l.url} rel="me noopener" className="btn relative min-h-11 gap-2 px-3 text-[14px] font-medium" title={l.display}>
                <LinkIcon k={l.key} />
                <span>{bidi(l.label, lang)}</span>
                <Ltr className="sr-only">{l.display}</Ltr>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
