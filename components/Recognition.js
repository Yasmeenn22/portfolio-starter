"use client";

import { useEffect, useRef, useState } from "react";
import { getUi } from "@/data/ui";
import { bidi, Ltr } from "@/lib/bidi";
import { onReveal } from "@/lib/reveal";

const TABS = [
  { key: "awards", prefix: "award-" },
  { key: "patents", prefix: "patent-" },
  { key: "publications", prefix: "pub-" },
];

export default function Recognition({ lang, awards, patents, publications, publicationsNote, publicationsLink }) {
  const t = getUi(lang).recognition;
  const [active, setActive] = useState("awards");
  const refs = useRef({});
  const lists = { awards, patents, publications };

  // A link to #patent-1 or #pub-2 opens the right tab first.
  useEffect(
    () =>
      onReveal((id) => {
        const tab = TABS.find((x) => id.startsWith(x.prefix));
        if (tab) setActive(tab.key);
      }),
    [],
  );

  function onKeyDown(e) {
    const i = TABS.findIndex((x) => x.key === active);
    const forward = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    const back = lang === "ar" ? "ArrowRight" : "ArrowLeft";
    let next = null;
    if (e.key === forward) next = (i + 1) % TABS.length;
    if (e.key === back) next = (i - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(TABS[next].key);
    refs.current[TABS[next].key]?.focus();
  }

  return (
    <div className="mt-8">
      <div role="tablist" aria-label={t.tabsLabel} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {TABS.map(({ key }) => (
          <button
            key={key}
            ref={(el) => (refs.current[key] = el)}
            role="tab"
            id={`rec-tab-${key}`}
            aria-selected={active === key}
            aria-controls={`rec-panel-${key}`}
            tabIndex={active === key ? 0 : -1}
            onClick={() => setActive(key)}
            className="chip"
          >
            {t[key]} <span className="n">{lists[key].length}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id="rec-panel-awards" aria-labelledby="rec-tab-awards" hidden={active !== "awards"} tabIndex={0} className="mt-6">
        <ol className="card divide-y divide-line">
          {awards.map((a, i) => (
            <li key={i} id={`award-${i}`} tabIndex={-1} className="grid gap-x-6 gap-y-1 p-4 md:grid-cols-12 md:items-baseline md:px-5">
              <p className="font-bold tabular-nums text-accent md:col-span-1">{a.year}</p>
              <p className="font-semibold leading-snug md:col-span-4">{bidi(a.title, lang)}</p>
              <p className="text-[15px] md:col-span-3">{bidi(a.org, lang)}</p>
              <p className="text-[15px] text-muted md:col-span-4">{bidi(a.for, lang)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div role="tabpanel" id="rec-panel-patents" aria-labelledby="rec-tab-patents" hidden={active !== "patents"} tabIndex={0} className="mt-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {patents.map((p, i) => (
            <li key={i} id={`patent-${i}`} tabIndex={-1} className="card flex flex-col gap-5 p-6">
              <span className={`badge self-start ${i === 0 ? "badge-accent" : ""}`}>
                <span aria-hidden="true">{i === 0 ? "●" : "◐"}</span>
                {p.status}
              </span>
              <p className="text-[1.25rem] font-semibold leading-snug">{bidi(p.title, lang)}</p>
              <p className="mt-auto text-[14px] text-muted">{bidi(p.number, lang)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div role="tabpanel" id="rec-panel-publications" aria-labelledby="rec-tab-publications" hidden={active !== "publications"} tabIndex={0} className="mt-6">
        <p className="text-[15px] text-muted">
          {publicationsNote}{" "}
          <a href={publicationsLink.url} className="link text-ink">
            <Ltr>{publicationsLink.display}</Ltr>
          </a>
        </p>
        <ol className="card mt-4 divide-y divide-line">
          {publications.map((p, i) => (
            <li key={i} id={`pub-${i}`} tabIndex={-1} className="flex gap-4 p-4 md:px-5">
              <span className="font-bold tabular-nums text-accent">{i + 1}.</span>
              <div className="min-w-0">
                {/* the original English citation, always left to right */}
                <p dir="ltr" lang="en" className="text-start leading-relaxed">
                  {p.authors} ({p.year}). <span className="font-semibold">{p.title}</span> <span className="text-muted">{p.venue}</span>
                </p>
                {lang === "ar" ? <p className="mt-1 text-[15px] text-muted">{p.titleLocal}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
