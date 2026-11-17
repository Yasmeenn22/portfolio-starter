"use client";

import { useEffect, useRef, useState } from "react";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";
import { onReveal } from "@/lib/reveal";
import { techIcon } from "@/lib/icons";
import BrandIcon from "@/components/BrandIcon";
import { useFlip } from "@/lib/useFlip";

const FILTERS = ["all", "leadership", "engineering", "startups", "research"];

// Roles that follow each other at the same company become one group (the Zayna promotion path).
function group(roles) {
  const out = [];
  for (const r of roles) {
    const last = out.at(-1);
    if (last && r.company && last.company === r.company) last.roles.push(r);
    else out.push({ company: r.company, location: r.location, roles: [r] });
  }
  return out;
}

export default function Experience({ lang, roles }) {
  const t = getUi(lang).experience;
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(() => new Set());
  const listRef = useRef(null);
  useFlip(listRef, filter);

  // A link to #exp-<id> (journey, skill explorer) clears the filter and opens that role.
  useEffect(
    () =>
      onReveal((id) => {
        if (!id.startsWith("exp-")) return;
        const key = id.slice(4);
        if (!roles.some((r) => r.id === key)) return;
        setFilter("all");
        setOpen((prev) => new Set(prev).add(key));
      }),
    [roles],
  );

  const shown = filter === "all" ? roles : roles.filter((r) => r.tags.includes(filter));
  const groups = group(shown);
  const allOpen = shown.length > 0 && shown.every((r) => open.has(r.id));
  const count = (f) => (f === "all" ? roles.length : roles.filter((r) => r.tags.includes(f)).length);
  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label={t.filterLabel} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {t.filters[f]} <span className="n">{count(f)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="link min-h-11 self-start text-[15px] font-medium md:self-auto"
          onClick={() => setOpen(allOpen ? new Set() : new Set(shown.map((r) => r.id)))}
        >
          {allOpen ? t.collapseAll : t.expandAll}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {t.showing(shown.length, roles.length)}
      </p>

      <ol ref={listRef} className="mt-6 grid gap-4">
        {groups.map((g) => {
          const path = g.roles.length > 1;
          return (
            <li key={g.roles[0].id} data-flip={g.roles[0].id} className={path ? "card p-4 md:p-5" : ""} data-reveal="">
              {path ? (
                <p className="mb-3 flex flex-wrap items-center gap-2 px-1">
                  <span className="font-semibold">{bidi(g.company, lang)}</span>
                  <span className="badge badge-accent">
                    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 19V5m0 0-6 6m6-6 6 6" /></svg>
                    {t.path(g.roles.length)}
                  </span>
                </p>
              ) : null}
              <ol className={path ? "relative grid gap-2 ps-5" : "grid gap-2"}>
                {path ? <span aria-hidden="true" className="absolute start-[7px] top-4 bottom-4 w-0.5 rounded bg-accent/40" /> : null}
                {g.roles.map((r) => {
                  const isOpen = open.has(r.id);
                  return (
                    <li key={r.id} id={`exp-${r.id}`} tabIndex={-1} className={`card relative overflow-hidden ${r.isBreak ? "border-dashed !bg-transparent shadow-none" : ""}`}>
                      {path ? <span aria-hidden="true" className="absolute start-[-15px] top-6 size-2.5 rounded-full bg-accent" /> : null}
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`exp-body-${r.id}`}
                          onClick={() => toggle(r.id)}
                          className="flex w-full items-start justify-between gap-4 p-4 text-start md:p-5"
                        >
                          <span className="min-w-0">
                            <span className="block text-[17px] font-semibold leading-snug">{bidi(r.role, lang)}</span>
                            <span className="mt-1 flex flex-wrap gap-x-2 text-[14.5px] text-muted">
                              {r.company ? <span className="font-medium text-ink">{bidi(r.company, lang)}</span> : null}
                              {r.company ? <span aria-hidden="true">·</span> : null}
                              <span>{r.location}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{r.period}</span>
                            </span>
                          </span>
                          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`mt-1 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                      </h3>
                      <div id={`exp-body-${r.id}`} hidden={!isOpen} className="border-t border-line px-4 pb-5 pt-4 md:px-5">
                        <ul className="grid list-disc gap-2 ps-5 marker:text-accent">
                          {r.points.map((p) => (
                            <li key={p}>{bidi(p, lang)}</li>
                          ))}
                        </ul>
                        {r.tech ? (
                          <div className="mt-4">
                            <p className="text-[13px] font-semibold text-muted">{t.technologies}</p>
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                              {r.tech.map((x) => (
                                <li key={x} className="tag" dir="ltr">
                                  <BrandIcon icon={techIcon(x)} size={14} />
                                  {x}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
