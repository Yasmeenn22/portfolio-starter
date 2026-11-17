"use client";

import { useState } from "react";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";
import { openTarget } from "@/lib/reveal";

// Level as text plus three steps, never colour alone.
function Steps({ rank, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[14px] font-semibold">{label}</span>
      <span aria-hidden="true" className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 w-4 rounded-full ${n <= rank ? "bg-accent" : "bg-line"}`} />
        ))}
      </span>
    </span>
  );
}

// Two levels: pick a skill area, then a tool; the proof cards where the CV names that
// tool are highlighted and the rest dim. Tools the CV never ties to an entry stay plain chips.
export default function SkillExplorer({ lang, areas, cards }) {
  const t = getUi(lang).about;
  const [area, setArea] = useState(0);
  const [tool, setTool] = useState(null);
  const [live, setLive] = useState("");
  const a = areas[area];
  const proofIds = [...new Set(a.tools.flatMap((x) => x.proofs))];
  const lit = tool !== null ? new Set(a.tools[tool].proofs) : null;

  function pickArea(i) {
    setArea(i);
    setTool(null);
    setLive("");
  }
  function pickTool(j) {
    if (tool === j) {
      setTool(null);
      setLive(t.cleared);
    } else {
      setTool(j);
      setLive(t.showing(a.tools[j].label, a.tools[j].proofs.length));
    }
  }

  return (
    <div className="mt-8">
      <div role="group" aria-label={t.skills} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {areas.map((x, i) => (
          <button
            key={x.area}
            type="button"
            aria-pressed={i === area}
            onClick={() => pickArea(i)}
            className={`card flex min-h-[108px] flex-col items-start justify-between gap-3 p-4 text-start transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 ${
              i === area ? "!border-accent !bg-accent-soft" : ""
            }`}
          >
            <span className="font-semibold leading-snug">{x.area}</span>
            <span className="flex w-full flex-wrap items-center justify-between gap-2">
              <Steps rank={x.levelRank} label={x.level} />
              <span className="text-[13px] tabular-nums text-muted">{t.yearsShort(x.years)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="card mt-4 p-5 md:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h4 className="h3">{a.area}</h4>
          <p className="text-[15px] text-muted">
            {a.level} · {t.years(a.years)}
          </p>
        </div>
        <p className="mt-4 text-[13px] font-semibold text-muted">{t.tools}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {a.tools.map((x, j) =>
            x.proofs.length ? (
              <li key={x.label}>
                <button type="button" className="chip" aria-pressed={tool === j} onClick={() => pickTool(j)}>
                  {bidi(x.label, lang)}
                  <span className="n">{x.proofs.length}</span>
                </button>
              </li>
            ) : (
              <li
                key={x.label}
                className="inline-flex min-h-10 items-center rounded-full border border-dashed border-line px-3.5 text-[14px] text-muted"
              >
                {bidi(x.label, lang)}
              </li>
            ),
          )}
        </ul>
        <p className="mt-3 text-[13px] text-muted">{proofIds.length ? t.toolHint : t.noProof}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>

        {proofIds.length ? (
          <>
            <p className="mt-6 text-[13px] font-semibold text-muted">{t.proofs}</p>
            <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {proofIds.map((id) => {
                const c = cards[id];
                const on = lit?.has(id);
                return (
                  <li
                    key={`${id}-${tool}`}
                    className={`transition-[opacity,transform] duration-300 ${lit ? (on ? "-translate-y-[3px]" : "opacity-[.28]") : ""}`}
                    style={on ? { animation: "pop .45s cubic-bezier(.2,1.5,.4,1) backwards" } : undefined}
                  >
                    <a
                      href={c.href}
                      onClick={c.hash ? (e) => openTarget(id, e) : undefined}
                      className={`block h-full rounded-[12px] border bg-bg p-4 text-ink no-underline transition-colors hover:border-accent ${
                        on ? "border-accent" : "border-line"
                      }`}
                    >
                      <span className="badge">{t.kinds[c.kind]}</span>
                      <span className="mt-2 block font-semibold leading-snug">{bidi(c.title, lang)}</span>
                      {c.sub ? <span className="mt-1 block text-[14px] text-muted">{bidi(c.sub, lang)}</span> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
