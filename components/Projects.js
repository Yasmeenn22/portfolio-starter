"use client";

import { useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";
import { localePath } from "@/lib/paths";
import { techIcon } from "@/lib/icons";
import BrandIcon from "@/components/BrandIcon";
import { useFlip } from "@/lib/useFlip";

// `projects` carries both the visitor's language and the English domain key for filtering.
export default function Projects({ lang, projects }) {
  const t = getUi(lang).projects;
  const domains = ["All", ...new Set(projects.map((p) => p.domain))];
  const [domain, setDomain] = useState("All");
  const listRef = useRef(null);
  useFlip(listRef, domain);
  const shown = domain === "All" ? projects : projects.filter((p) => p.domain === domain);
  const count = (d) => (d === "All" ? projects.length : projects.filter((p) => p.domain === d).length);

  return (
    <div className="mt-8">
      <div role="group" aria-label={t.filterLabel} className="flex flex-wrap gap-2">
        {domains.map((d) => (
          <button key={d} type="button" className="chip" aria-pressed={domain === d} onClick={() => setDomain(d)}>
            {d === "All" ? t.all : t.domains[d]} <span className="n">{count(d)}</span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {t.showing(shown.length, projects.length)}
      </p>
      <ul ref={listRef} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((p) => (
          <li key={p.slug} data-flip={p.slug} data-reveal="">
            <article className="card card-link spot flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="badge">{t.domains[p.domain]}</span>
                <span className="text-[13px] tabular-nums text-muted">{p.period}</span>
              </div>
              <h3 className="h3 mt-4">
                <Link href={localePath(lang, `/projects/${p.slug}/`)} className="text-ink no-underline after:absolute after:inset-0 after:rounded-[var(--radius)] after:content-['']">
                  <ViewTransition name={`project-${p.slug}`} share="morph" default="none">
                    <span>{bidi(p.name, lang)}</span>
                  </ViewTransition>
                </Link>
              </h3>
              {p.org ? <p className="mt-1 text-[14px] text-muted">{bidi(p.org, lang)}</p> : null}
              <p className="mt-4">
                <span dir="ltr" className="metric inline-block text-[1.9rem] font-bold leading-none tracking-tight text-accent">
                  {p.metric.value}
                </span>
                <span className="mt-1 block text-[14px] text-muted">{bidi(p.metric.label, lang)}</span>
              </p>
              <p className="mt-3 text-[15px] leading-relaxed">{bidi(p.result, lang)}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5 pt-5" aria-label={t.technologies}>
                {p.tech.map((x) => (
                  <li key={x} className="tag !text-[12.5px]" dir="ltr">
                    <BrandIcon icon={techIcon(x)} size={13} />
                    {x}
                  </li>
                ))}
              </ul>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent" aria-hidden="true">
                {t.open}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="flip-rtl"><path d="M5 12h14m0 0-6-6m6 6-6 6" /></svg>
              </span>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
