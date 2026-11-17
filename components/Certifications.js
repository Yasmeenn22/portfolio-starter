"use client";

import { useEffect, useRef, useState } from "react";
import { getUi } from "@/data/ui";
import { bidi, Ltr } from "@/lib/bidi";
import { onReveal } from "@/lib/reveal";
import { useFlip } from "@/lib/useFlip";

const STATUSES = ["All", "Active", "Lifetime", "Expired", "In progress"];

export default function Certifications({ lang, items, note }) {
  const t = getUi(lang).education;
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const listRef = useRef(null);
  useFlip(listRef, `${status}|${query}`);

  // A link to #cert-<i> clears the filter and the search so the entry is visible.
  useEffect(
    () =>
      onReveal((id) => {
        if (!id.startsWith("cert-")) return;
        setStatus("All");
        setQuery("");
      }),
    [],
  );

  const q = query.trim().toLowerCase();
  const shown = items
    .map((c, i) => ({ ...c, i }))
    .filter((c) => (status === "All" || c.status === status) && (!q || [c.name, c.issuer, c.id, c.year, c.statusText].join(" ").toLowerCase().includes(q)));
  const count = (s) => (s === "All" ? items.length : items.filter((c) => c.status === s).length);

  return (
    <div className="mt-6">
      <p className="text-[15px] text-muted">{note}</p>
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label={t.statusLabel} className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {t.statuses[s]} <span className="n">{count(s)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 lg:w-80">
          <label htmlFor="cert-search" className="text-[13px] font-semibold text-muted">
            {t.search}
          </label>
          <input
            id="cert-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-h-11 rounded-[12px] border border-line bg-surface px-3.5 text-[16px] text-ink placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {t.shown(shown.length, items.length)}
      </p>

      <ul ref={listRef} className="card mt-5 divide-y divide-line overflow-hidden">
        {shown.length === 0 ? <li className="p-5 text-muted">{t.noMatch(query)}</li> : null}
        {shown.map((c) => (
          <li key={c.i} data-flip={c.i} id={`cert-${c.i}`} tabIndex={-1} className="grid gap-x-6 gap-y-1.5 p-4 md:grid-cols-12 md:items-center md:px-5">
            <div className="min-w-0 md:col-span-6">
              <p className="font-semibold leading-snug">{bidi(c.name, lang)}</p>
              <p className="text-[14px] text-muted">{bidi(c.issuer, lang)}</p>
            </div>
            <p className="text-[14px] tabular-nums text-muted md:col-span-1">{c.year || "—"}</p>
            <p className="md:col-span-2">
              <span className={`badge ${c.status === "In progress" ? "badge-accent" : ""} !whitespace-normal`}>
                <span aria-hidden="true">{c.status === "Expired" ? "○" : c.status === "In progress" ? "◐" : "●"}</span>
                {c.statusText}
              </span>
            </p>
            <p className="text-[13px] text-muted md:col-span-3 md:text-end">
              {c.id ? (
                <>
                  <span className="me-1 md:sr-only">{t.credential}:</span>
                  <Ltr className="font-mono">{c.id}</Ltr>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
