import Image from "next/image";
import { getCv } from "@/data/cv";
import { getUi } from "@/data/ui";
import { cvHref } from "@/lib/paths";
import { bidi, Ltr } from "@/lib/bidi";
import LinkIcon from "@/components/LinkIcon";
import portrait from "@/assets/yara/portrait.jpg";

export default function Hero({ lang }) {
  const cv = getCv(lang);
  const t = getUi(lang);
  return (
    <section id="top" aria-labelledby="top-title" data-tip="top" className="pb-20 pt-10 md:pb-24 md:pt-16">
      <div className="wrap">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:gap-10">
          <Image
            src={portrait}
            alt={t.hero.portraitAlt}
            width={200}
            height={200}
            priority
            sizes="(min-width: 768px) 200px, 128px"
            className="size-32 shrink-0 rounded-[24px] object-cover shadow-[var(--shadow)] ring-1 ring-line md:size-[200px] md:rounded-[32px]"
          />
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-2">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              {cv.location}
            </p>
            <h1 id="top-title" className="h1 mt-3">{cv.name}</h1>
            <ul className="mt-4 flex flex-col gap-1 text-[17px] font-semibold sm:flex-row sm:flex-wrap sm:gap-x-3 md:text-[19px]">
              {cv.headline.map((h, i) => (
                <li key={h} className="flex items-center gap-3">
                  {i > 0 ? <span aria-hidden="true" className="hidden text-accent-2 sm:inline">|</span> : null}
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="lead mt-8 max-w-[52ch] text-[1.25rem] !text-ink">
          {cv.heroLine}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#projects" className="btn btn-primary">
            {t.hero.viewWork}
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flip-rtl"><path d="M5 12h14m0 0-6-6m6 6-6 6" /></svg>
          </a>
          <a href={cvHref(cv)} download className="btn">
            {t.cv.download}
            {lang === "ar" ? <span className="text-[13px] font-medium text-muted">({t.cv.note})</span> : null}
          </a>
        </div>

        <ul aria-label={t.hero.profiles} className="mt-10 flex flex-wrap gap-2">
          {cv.links.map((l) => (
            <li key={l.key}>
              <a href={l.url} rel="me noopener" className="btn min-h-11 gap-2 px-3 text-[14px] font-medium" title={l.display}>
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
