"use client";

import { useEffect, useRef, useState } from "react";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";
import { onReveal } from "@/lib/reveal";
import { KNIGHT_HOME } from "@/lib/board";

/*
  "The Board": 15 CV items as pieces on an 8×8 board. No rules, no score:
  tap a piece to read it, or press "Play the story" and a knight hops from piece to piece
  (languages, then giving back by start date, then interests), about 2 seconds a stop.
  Squares are real buttons; the arrow keys move between them; the card is aria-live.
  The grid follows the page direction, so in Arabic the board is mirrored and the story
  starts on the right. When the board scrolls into view the pieces drop onto their squares one by
  one (story order); the knight hops along a short arc (its slide plus a lift in the middle).
*/
const GLYPH = { languages: "♝", leadership: "♜", interests: "♞" };
const TEXT = "︎"; // keep chess glyphs as text, never emoji
const FILES = "abcdefgh";
const STOP_MS = 2200;

export default function Board({ lang, items, leadershipNote }) {
  const t = getUi(lang).board;
  const rtl = lang === "ar";
  const [group, setGroup] = useState("all");
  const [list, setList] = useState(false);
  const [selected, setSelected] = useState(null); // index into items
  const [seen, setSeen] = useState(() => new Set());
  const [story, setStory] = useState(-1); // current story stop, -1 = not started
  const [playing, setPlaying] = useState(false);
  const [focus, setFocus] = useState(`${items[0].square[0]}-${items[0].square[1]}`);
  const squareRefs = useRef({});

  const bySquare = Object.fromEntries(items.map((it, i) => [`${it.square[0]}-${it.square[1]}`, i]));
  const knight = story >= 0 ? items[story].square : KNIGHT_HOME;
  const done = seen.size === items.length;

  function show(i) {
    setSelected(i);
    setSeen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }
  function step() {
    const next = story + 1;
    if (next >= items.length) {
      setPlaying(false);
      return;
    }
    setStory(next);
    show(next);
  }

  // The story plays on its own, one stop about every 2 seconds, until paused or finished.
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      const next = story + 1;
      if (next >= items.length) return setPlaying(false);
      setStory(next);
      setSelected(next);
      setSeen((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
    }, story < 0 ? 300 : STOP_MS);
    return () => clearTimeout(id);
  }, [playing, story, items.length]);

  // Dalil keeps quiet while the story plays.
  useEffect(() => {
    document.body.toggleAttribute("data-story-playing", playing);
    return () => document.body.removeAttribute("data-story-playing");
  }, [playing]);

  // Links to #lang-1, #lead-2 or #interest-0 (from the skill explorer) open the list view.
  useEffect(
    () =>
      onReveal((id) => {
        if (/^(lead|lang|interest)-\d+$/.test(id)) setList(true);
      }),
    [],
  );

  function play() {
    if (story >= items.length - 1) {
      setStory(-1);
    }
    setPlaying(true);
  }
  function reset() {
    setPlaying(false);
    setStory(-1);
    setSelected(null);
    setSeen(new Set());
  }

  function onKeyDown(e) {
    const [r, c] = focus.split("-").map(Number);
    const right = rtl ? -1 : 1;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -right], ArrowRight: [0, right] };
    let next = null;
    if (moves[e.key]) {
      const [dr, dc] = moves[e.key];
      next = `${Math.min(7, Math.max(0, r + dr))}-${Math.min(7, Math.max(0, c + dc))}`;
    } else if (e.key === "Home") next = `${r}-0`;
    else if (e.key === "End") next = `${r}-7`;
    if (!next) return;
    e.preventDefault();
    setFocus(next);
    squareRefs.current[next]?.focus();
  }

  const current = selected !== null ? items[selected] : null;
  const legend = ["languages", "leadership", "interests"];

  const controls = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label={t.groupsLabel} className="flex flex-wrap gap-2">
        {["all", ...legend].map((g) => (
          <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
            {g !== "all" ? (
              <span aria-hidden="true" className="text-[17px] leading-none">
                {GLYPH[g] + TEXT}
              </span>
            ) : null}
            {t.groups[g]}
          </button>
        ))}
      </div>
      <button type="button" className="chip self-start" aria-pressed={list} onClick={() => setList((v) => !v)}>
        {list ? t.viewBoard : t.viewList}
      </button>
    </div>
  );

  if (list) {
    let k = 0;
    const sizes = [5, 6, 4];
    return (
      <div className="card mt-8 p-5 md:p-7">
        {controls}
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {sizes.map((n, g) => {
            const group_ = items.slice(k, (k += n));
            return (
              <div key={g} className={group !== "all" && group !== legend[g] ? "opacity-40" : ""}>
                <h3 className="h3 flex items-center gap-2">
                  <span aria-hidden="true" className="text-[22px] leading-none text-accent">
                    {GLYPH[legend[g]] + TEXT}
                  </span>
                  {t.listHeadings[g]}
                </h3>
                {g === 1 ? <p className="mt-1 text-[14px] text-muted">{leadershipNote}</p> : null}
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {group_.map((it) => (
                    <li key={it.id} id={it.id} tabIndex={-1} className="py-3">
                      <p className="font-semibold leading-snug">{bidi(it.title, lang)}</p>
                      {it.sub ? <p className="text-[14px] text-muted">{bidi(it.sub, lang)}</p> : null}
                      {it.text ? <p className="mt-1 text-[15px]">{bidi(it.text, lang)}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // knight position in physical terms (the overlay is placed from the left in both directions)
  const kx = rtl ? 7 - knight[1] : knight[1];

  return (
    <div className="card mt-8 p-4 sm:p-5 md:p-7">
      {controls}

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* the board */}
        <div className="lg:col-span-6">
          <div className="relative mx-auto aspect-square w-full max-w-[480px] overflow-hidden rounded-[14px] border border-line">
            <div role="group" aria-label={t.boardLabel} onKeyDown={onKeyDown} className="grid size-full grid-cols-8 grid-rows-8" data-stage="">
              {Array.from({ length: 64 }, (_, n) => {
                const r = Math.floor(n / 8);
                const c = n % 8;
                const key = `${r}-${c}`;
                const i = bySquare[key];
                const it = i !== undefined ? items[i] : null;
                const dark = (r + c) % 2 === 1;
                const isSel = selected === i && it;
                const dim = it && group !== "all" && it.group !== group;
                const knightHere = story >= 0 && knight[0] === r && knight[1] === c;
                const sq = `${FILES[c]}${8 - r}`;
                return (
                  <button
                    key={key}
                    ref={(el) => (squareRefs.current[key] = el)}
                    type="button"
                    tabIndex={focus === key ? 0 : -1}
                    onFocus={() => setFocus(key)}
                    onClick={() => {
                      if (!it) return;
                      setPlaying(false);
                      show(i);
                    }}
                    aria-label={it ? t.piece(t.pieceName[it.group], [it.title, it.text].filter(Boolean).join(", ")) : t.empty(sq)}
                    aria-pressed={it ? Boolean(isSel) : undefined}
                    className={`group relative grid place-items-center outline-offset-[-3px] focus-visible:z-10 ${dark ? "bg-surface-2" : "bg-surface"} ${it ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {isSel ? <span aria-hidden="true" className="board-glow absolute inset-0 bg-accent-soft ring-2 ring-inset ring-accent" /> : null}
                    {it ? (
                      <span
                        aria-hidden="true"
                        style={{ "--pi": i }}
                        className={`board-piece relative text-[clamp(22px,6.4vw,38px)] leading-none transition-[transform,opacity] duration-300 ${
                          it.group === "languages" ? "text-accent" : it.group === "interests" ? "text-accent-2" : "text-ink"
                        } ${isSel ? "-translate-y-1 scale-[1.15]" : "group-hover:-translate-y-0.5"} ${dim ? "opacity-25" : ""} ${knightHere ? "opacity-20" : ""}`}
                      >
                        {GLYPH[it.group] + TEXT}
                      </span>
                    ) : null}
                    {it && seen.has(i) && !isSel ? (
                      <span aria-hidden="true" className="absolute end-1 top-1 size-1.5 rounded-full bg-accent" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {/* file and rank labels on their own layer (they follow the page direction too) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-8 grid-rows-8">
              {Array.from({ length: 64 }, (_, n) => {
                const r = Math.floor(n / 8);
                const c = n % 8;
                return (
                  <span key={n} className="relative">
                    {c === 0 ? <span className="absolute start-[3px] top-[1px] text-[9px] text-muted">{8 - r}</span> : null}
                    {r === 7 ? <span className="absolute bottom-[1px] end-[3px] text-[9px] text-muted">{FILES[c]}</span> : null}
                  </span>
                );
              })}
            </div>
            {/* the story knight */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-[2] grid size-[12.5%] place-items-center transition-transform duration-[650ms] ease-[cubic-bezier(.45,0,.55,1)]"
              style={{ transform: `translate(${kx * 100}%, ${knight[0] * 100}%)` }}
            >
              <span key={story} className="knight-hop grid size-[78%] place-items-center rounded-full bg-ink text-[clamp(18px,5vw,28px)] leading-none text-bg shadow-lg">
                {"♞" + TEXT}
              </span>
            </span>
          </div>

          <ul aria-label={t.legendLabel} className="mx-auto mt-3 flex max-w-[480px] flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted">
            {legend.map((g) => (
              <li key={g} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`text-[17px] leading-none ${g === "languages" ? "text-accent" : g === "interests" ? "text-accent-2" : "text-ink"}`}>
                  {GLYPH[g] + TEXT}
                </span>
                {t.pieces[g]}
              </li>
            ))}
          </ul>
        </div>

        {/* story controls, progress and the detail card */}
        <div className="flex flex-col gap-4 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={playing ? () => setPlaying(false) : play} aria-pressed={playing}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                {playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5.5v13l11-6.5z" className={rtl ? "" : ""} />}
              </svg>
              {playing ? t.pause : story >= 0 && story < items.length - 1 ? t.resume : t.play}
            </button>
            <button type="button" className="btn" onClick={() => { setPlaying(false); step(); }} disabled={story >= items.length - 1}>
              {t.next}
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="flip-rtl">
                <path d="M5 12h14m0 0-6-6m6 6-6 6" />
              </svg>
            </button>
          </div>

          <div>
            <p className="text-[14px] font-semibold tabular-nums">{t.discovered(seen.size)}</p>
            <span aria-hidden="true" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full origin-left rounded-full bg-accent transition-transform duration-500 rtl:origin-right"
                style={{ transform: `scaleX(${seen.size / items.length})` }}
              />
            </span>
          </div>

          <div aria-live="polite" className="min-h-[190px] rounded-[12px] border border-line bg-bg p-5">
            {current ? (
              <div key={selected} className="board-card">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-muted">
                  <span aria-hidden="true" className="text-[20px] leading-none text-ink">
                    {GLYPH[current.group] + TEXT}
                  </span>
                  {t.pieces[current.group]}
                  {story >= 0 && story === selected ? <span className="badge badge-accent">{t.storyStop(story + 1)}</span> : null}
                </p>
                <h3 className="mt-3 text-[1.3rem] font-bold leading-snug">{bidi(current.title, lang)}</h3>
                {current.sub ? <p className="mt-1 text-muted">{bidi(current.sub, lang)}</p> : null}
                {current.text ? <p className="mt-2 text-[1.05rem] leading-relaxed">{bidi(current.text, lang)}</p> : null}
                {current.group === "leadership" ? <p className="mt-3 text-[13px] text-muted">{leadershipNote}</p> : null}
              </div>
            ) : (
              <>
                <p className="text-[1.15rem] font-semibold leading-snug">{t.pick}</p>
                <p className="mt-2 text-muted">{t.pickSub}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {done ? (
        <div className="board-card mt-6 rounded-[12px] border border-accent bg-accent-soft p-5 md:p-6">
          <p className="text-[1.25rem] font-bold">
            <span aria-hidden="true" className="me-2">{"♚" + TEXT}</span>
            {t.done}
          </p>
          <h3 className="mt-4 text-[13px] font-semibold text-muted">{t.summary}</h3>
          <ol className="mt-2 grid gap-x-6 gap-y-1.5 md:grid-cols-3">
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
          <button type="button" className="btn mt-5" onClick={reset}>
            {t.reset}
          </button>
        </div>
      ) : null}
    </div>
  );
}
