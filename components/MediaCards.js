"use client";

import { useEffect, useRef, useState } from "react";
import { getUi } from "@/data/ui";
import { bidi, Ltr } from "@/lib/bidi";

// One cover per kind, drawn in the site's own colours (no borrowed thumbnails).
function Cover({ kind }) {
  const glyph = {
    cover: <path d="M7 4h10v16H7zM10 8h4M10 11h4M10 14h2" />,
    podcast: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </>
    ),
    channel: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="m10.5 9.5 4 2.5-4 2.5z" />
      </>
    ),
    article: <path d="M6 4h9l3 3v13H6zM9 10h6M9 13h6M9 16h4" />,
  }[kind];
  return (
    <span aria-hidden="true" className="cover-art absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_55%,var(--ink)))]">
      <span className="absolute -end-10 -top-10 size-40 rounded-full bg-[var(--accent-2)] opacity-25" />
      <span className="absolute -bottom-12 -start-8 size-32 rounded-full border-[14px] border-white/15" />
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute start-5 top-5 opacity-90">
        {glyph}
      </svg>
    </span>
  );
}

// The cards fan in as the section enters: the outer ones tilt most (degrees), mirrored in Arabic.
const FAN = [-4, -1.5, 1.5, 4];

const quote = (s, lang) => (lang === "ar" ? `«${s}»` : `“${s}”`);

export default function MediaCards({ lang, media }) {
  const t = getUi(lang).speaking;
  const [current, setCurrent] = useState(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const closeRef = useRef(null);

  function open(i, e) {
    openerRef.current = e.currentTarget;
    setCurrent(i);
  }
  useEffect(() => {
    const d = dialogRef.current;
    if (current !== null && d && !d.open) {
      d.showModal();
      closeRef.current?.focus(); // not the iframe, so Escape reaches the dialog
    }
  }, [current]);
  // Closing removes the iframe (audio stops) and returns focus to the card.
  function onClose() {
    setCurrent(null);
    openerRef.current?.focus();
  }

  const m = current !== null ? media[current] : null;
  return (
    <>
      <ul className="fan -mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {media.map((item, i) => (
          <li
            key={i}
            id={`media-${i}`}
            tabIndex={-1}
            className="w-[78%] shrink-0 snap-start sm:w-auto"
            data-reveal=""
            style={{ "--fan": FAN[i % FAN.length] * (lang === "ar" ? -1 : 1) }}
          >
            <button
              type="button"
              onClick={(e) => open(i, e)}
              className="card card-link spot group relative flex h-full w-full flex-col overflow-hidden text-start"
            >
              <span className="sr-only">{t.playShort} </span>
              <span className="relative block aspect-video">
                <Cover kind={item.kind} />
                <span className="absolute bottom-3 start-3 rounded-full bg-black/35 px-2.5 py-0.5 text-[12px] font-semibold text-white backdrop-blur-sm">
                  {item.type}
                </span>
                <span className="play-pulse absolute end-3 bottom-3 grid size-11 place-items-center rounded-full bg-white text-[#0e1116] shadow-lg transition-transform group-hover:scale-105">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                </span>
              </span>
              <span className="flex flex-1 flex-col p-4">
                <span className="font-semibold leading-snug">{item.quoted ? quote(item.title, lang) : bidi(item.title, lang)}</span>
                <span className="mt-1.5 text-[14px] text-muted">{bidi(item.parts.join(" · "), lang)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={onClose}
        aria-label={t.dialogLabel}
        className="m-auto w-[min(960px,calc(100vw-24px))] max-w-none rounded-[18px] border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {m ? (
          <div>
            <div dir="ltr" className="relative aspect-video bg-black">
              <iframe
                className="absolute inset-0 size-full"
                src={`https://www.youtube-nocookie.com/embed/${m.video.id}?autoplay=1&rel=0`}
                title={t.videoTitle(m.title)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="badge">{m.type}</span>
                  {m.video.placeholder ? <span className="badge badge-accent">{t.sample}</span> : null}
                </p>
                <p className="mt-2 text-[1.1rem] font-semibold leading-snug">
                  {m.quoted ? quote(m.title, lang) : bidi(m.title, lang)} · {bidi(m.parts.join(" · "), lang)}
                </p>
                {m.video.placeholder ? <p className="mt-1 text-[13px] text-muted">{t.sampleNote}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {m.link ? (
                  <a href={m.link.url} className="btn">
                    {t.visit} <Ltr>{m.link.display}</Ltr>
                  </a>
                ) : null}
                <form method="dialog">
                  <button ref={closeRef} className="btn btn-primary">
                    {t.close}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
