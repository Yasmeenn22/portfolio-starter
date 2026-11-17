"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";
import { onReveal } from "@/lib/reveal";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const LEGS = [5, 6, 4]; // languages, giving back, off the clock

// "The Long Run": 15 checkpoints in three legs. Each one tells a line of story from the CV,
// asks a three-option guess, then shows the item exactly as the CV states it. No way to lose.
// `items` are the 15 CV entries in checkpoint order: { title, text, group }.
export default function LongRun({ lang, items, leadershipNote }) {
  const t = getUi(lang).game;
  const [list, setList] = useState(false);
  const [at, setAt] = useState(0); // checkpoint on screen
  const [answers, setAnswers] = useState(() => Array(15).fill(null)); // first choice per checkpoint
  const [done, setDone] = useState(false);
  const [live, setLive] = useState("");
  const trackRef = useRef(null);
  const markerRef = useRef(null);
  const cardRef = useRef(null);

  const reached = answers.findIndex((a) => a === null); // first unanswered
  const furthest = reached === -1 ? 14 : reached;
  const firstRight = answers.filter((a, i) => a !== null && a === t.checkpoints[i].answer).length;
  const cp = t.checkpoints[at];
  const chosen = answers[at];

  // Game in progress: Dalil keeps quiet.
  useEffect(() => {
    const playing = answers.some((a) => a !== null) && !done && !list;
    document.body.toggleAttribute("data-game-active", playing);
    return () => document.body.removeAttribute("data-game-active");
  }, [answers, done, list]);

  // Links to #lead-2, #lang-1 or #interest-0 open the list view.
  useEffect(
    () =>
      onReveal((id) => {
        if (/^(lead|lang|interest)-\d+$/.test(id)) setList(true);
      }),
    [],
  );

  // The marker slides to the current dot (measured, so it works when legs wrap and in RTL).
  const place = () => {
    const track = trackRef.current;
    const dot = track?.querySelector(`[data-cp="${done ? 14 : at}"]`);
    if (!dot || !markerRef.current) return;
    const tr = track.getBoundingClientRect();
    const r = dot.getBoundingClientRect();
    markerRef.current.style.transform = `translate(${r.left - tr.left + r.width / 2 - 14}px, ${r.top - tr.top + r.height / 2 - 14}px)`;
    markerRef.current.style.opacity = "1";
  };
  useIsoLayoutEffect(place, [at, done, list]);
  useEffect(() => {
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  });

  function choose(o) {
    if (chosen !== null) return;
    const next = [...answers];
    next[at] = o;
    setAnswers(next);
    setLive(`${o === cp.answer ? t.right : t.wrong}. ${t.fromCv}: ${items[at].title}${items[at].text ? `, ${items[at].text}` : ""}`);
  }
  function advance() {
    if (at === 14) {
      setDone(true);
      setLive(t.done(answers.filter((a, i) => a === t.checkpoints[i].answer).length));
    } else setAt(at + 1);
    requestAnimationFrame(() => cardRef.current?.focus());
  }
  function again() {
    setAnswers(Array(15).fill(null));
    setAt(0);
    setDone(false);
    setLive("");
    requestAnimationFrame(() => cardRef.current?.focus());
  }

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="h3">{t.name}</p>
      <button type="button" className="chip" aria-pressed={list} onClick={() => setList((v) => !v)}>
        {list ? t.viewGame : t.viewList}
      </button>
    </div>
  );

  if (list) {
    let k = 0;
    return (
      <div className="card mt-8 p-5 md:p-7">
        {header}
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {[0, 1, 2].map((g) => (
            <div key={g}>
              <h3 className="h3">{t.listHeadings[g]}</h3>
              {g === 1 ? <p className="mt-1 text-[14px] text-muted">{leadershipNote}</p> : null}
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {Array.from({ length: LEGS[g] }, () => items[k++]).map((it) => (
                  <li key={it.id} id={it.id} tabIndex={-1} className="py-3">
                    <p className="font-semibold leading-snug">{bidi(it.title, lang)}</p>
                    {it.sub ? <p className="text-[14px] text-muted">{bidi(it.sub, lang)}</p> : null}
                    {it.text ? <p className="mt-1 text-[15px]">{bidi(it.text, lang)}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-8 p-5 md:p-7">
      {header}

      {/* the track: three legs, 15 dots, one marker */}
      <div ref={trackRef} className="relative mt-6" role="group" aria-label={t.track}>
        <span
          ref={markerRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-[1] grid size-7 place-items-center rounded-full bg-ink opacity-0 shadow-md transition-transform duration-500 ease-[cubic-bezier(.5,1.3,.45,1)]"
        >
          <span className="size-2.5 rounded-full bg-bg" />
        </span>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-3">
          {LEGS.map((len, g) => (
            <div key={g} className="min-w-0 lg:flex-[var(--w)]" style={{ "--w": len }}>
              <p className="text-[12.5px] font-semibold text-muted">{t.legs[g]}</p>
              <ol className="relative mt-2 flex items-center justify-between">
                <span aria-hidden="true" className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded bg-line" />
                {Array.from({ length: len }, (_, k) => {
                  const i = LEGS.slice(0, g).reduce((a, b) => a + b, 0) + k;
                  const visited = i <= furthest && (answers[i] !== null || i === furthest);
                  const label = visited ? t.goTo(i + 1, items[i].title) : t.upcoming(i + 1);
                  const right = answers[i] !== null && answers[i] === t.checkpoints[i].answer;
                  return (
                    <li key={i} className="relative">
                      <button
                        type="button"
                        data-cp={i}
                        disabled={!visited}
                        onClick={() => {
                          setDone(false);
                          setAt(i);
                        }}
                        aria-label={label}
                        aria-current={i === at && !done ? "step" : undefined}
                        className="grid size-7 place-items-center rounded-full disabled:cursor-default"
                      >
                        <span
                          aria-hidden="true"
                          className={`block rounded-full transition-all duration-300 ${
                            answers[i] !== null
                              ? `size-3.5 ${right ? "bg-accent" : "bg-accent-2"}`
                              : visited
                                ? "size-3.5 border-2 border-accent bg-surface"
                                : "size-2.5 bg-line"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <div ref={cardRef} tabIndex={-1} className="mt-6 rounded-[12px] border border-line bg-bg p-5 outline-offset-4 md:p-6">
        {done ? (
          <>
            <p className="text-[1.35rem] font-bold leading-snug">{t.done(firstRight)}</p>
            <h3 className="mt-5 text-[13px] font-semibold text-muted">{t.summary}</h3>
            <ol className="mt-2 grid gap-x-6 gap-y-2 md:grid-cols-3">
              {items.map((it, i) => (
                <li key={it.id} className="flex gap-2 text-[15px]">
                  <span className="tabular-nums text-muted">{i + 1}.</span>
                  <span>
                    <span className="font-semibold">{bidi(it.title, lang)}</span>
                    {it.text ? <span className="text-muted">: {bidi(it.text, lang)}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-primary mt-6" onClick={again}>
              {t.again}
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-accent">
              {t.checkpoint(at + 1)} · {t.legs[at < 5 ? 0 : at < 11 ? 1 : 2]}
            </p>
            <p className="mt-2 text-[1.1rem] leading-relaxed">{bidi(cp.story, lang)}</p>
            <fieldset className="mt-4">
              <legend className="font-semibold">{bidi(cp.question, lang)}</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {cp.options.map((o, i) => {
                  const isAnswer = i === cp.answer;
                  const picked = chosen === i;
                  const state = chosen === null ? "" : isAnswer ? "border-accent bg-accent-soft" : picked ? "border-accent-2" : "opacity-60";
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(i)}
                      aria-pressed={picked}
                      disabled={chosen !== null && !picked && !isAnswer}
                      className={`flex min-h-12 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2 text-start font-medium transition-colors hover:border-accent disabled:hover:border-line ${state}`}
                    >
                      {chosen !== null && isAnswer ? (
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" className="shrink-0"><path d="m5 12 5 5L20 7" /></svg>
                      ) : null}
                      {chosen !== null && picked && !isAnswer ? (
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2.6" strokeLinecap="round" className="shrink-0"><path d="M6 6l12 12M18 6 6 18" /></svg>
                      ) : null}
                      <span>{bidi(o, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {chosen !== null ? (
              <div className="mt-5 border-t border-line pt-4">
                <p className="font-bold">{chosen === cp.answer ? `✓ ${t.right}` : `✗ ${t.wrong}`}</p>
                <p className="mt-1 text-[13px] font-semibold text-muted">{t.fromCv}</p>
                <p className="mt-1 text-[1.05rem]">
                  <span className="font-semibold">{bidi(items[at].title, lang)}</span>
                  {items[at].sub ? <span className="text-muted"> · {bidi(items[at].sub, lang)}</span> : null}
                  {items[at].text ? <span>: {bidi(items[at].text, lang)}</span> : null}
                </p>
                <button type="button" className="btn btn-primary mt-4" onClick={advance}>
                  {at === 14 ? t.finish : t.next}
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flip-rtl"><path d="M5 12h14m0 0-6-6m6 6-6 6" /></svg>
                </button>
              </div>
            ) : (
              <p className="mt-3 text-[14px] text-muted">{t.choose}</p>
            )}
          </>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
