"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getUi } from "@/data/ui";
import { SECTIONS } from "@/lib/sections";
import { neutralPath } from "@/lib/paths";
import { goToOtherLang } from "@/components/LangSwitch";

/*
  Dalil (دليل), the page guide. It never moves on its own, cannot be dragged and has no face.
  ≥1280px: rides a thin rail in the end-side gutter; its place on the rail is the scroll progress,
           and each section has a tick (a button) on the rail, so the rail is also a page map.
  <1280px: a fixed button in the bottom end corner with a ring showing scroll progress.
  Tips: arriving at a section (by scrolling, the navbar or the rail) shows that section's tip on
  its own after 600ms, once per visit. A pointer resting on a [data-tip] element still gets its
  tip, but a section arrival comes first. One bubble at a time, at least 4s apart, hidden after 5s,
  on Escape or when the visitor scrolls on. Never while typing, while a dialog or video is open or
  while the Board's story plays. "Mute tips" in the panel turns all of it off and is remembered.
*/
const TIP_DELAY = 900;
const TIP_GAP = 4000; // at least 4 seconds between two bubbles
const TIP_LIFE = 5000;
const ARRIVE_DELAY = 600; // a section's tip shows this long after the visitor arrives
const SCROLL_HIDE = 180; // a bubble hides once the visitor scrolls on this far
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

const WIDE = "(min-width: 80rem)";
const MUTE_EVENT = "dalil-mute";
const subscribeWide = (cb) => {
  const mq = matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeMuted = (cb) => {
  window.addEventListener(MUTE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(MUTE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

// Dalil is not needed in the first second: it mounts once the browser is idle,
// so the page becomes interactive sooner.
let idle = false;
const subscribeIdle = (cb) => {
  if (idle) return () => {};
  const done = () => {
    idle = true;
    cb();
  };
  const id = "requestIdleCallback" in window ? requestIdleCallback(done, { timeout: 2500 }) : setTimeout(done, 1200);
  return () => ("cancelIdleCallback" in window ? cancelIdleCallback(id) : clearTimeout(id));
};

export default function Dalil(props) {
  const ready = useSyncExternalStore(subscribeIdle, () => idle, () => false);
  return ready ? <DalilGuide {...props} /> : null;
}

function DalilGuide({ lang, cvHref }) {
  const t = getUi(lang);
  const d = t.dalil;
  const pathname = usePathname();
  const onHome = neutralPath(pathname || "/") === "/";

  const [progress, setProgress] = useState(0);
  const [ticks, setTicks] = useState([]);
  const [current, setCurrent] = useState("top");
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(null); // { text, top }
  const [closing, setClosing] = useState(false);
  const [nod, setNod] = useState(0);
  const muted = useSyncExternalStore(subscribeMuted, () => store.get("dalil-muted") === "1", () => false);
  const wide = useSyncExternalStore(subscribeWide, () => matchMedia(WIDE).matches, () => false);

  const badgeRef = useRef(null);
  const glyphRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const railRef = useRef(null);
  const state = useRef({ shown: new Set(), arrived: new Set(), last: 0, timer: 0, hide: 0, close: 0, arrive: 0, target: null, visible: false, shownY: 0 });
  // The latest tip functions, for listeners that are added once.
  const fns = useRef({});

  function hideTip() {
    const st = state.current;
    clearTimeout(st.hide);
    st.target = null;
    if (!st.visible) return;
    st.visible = false;
    setClosing(true); // the bubble closes softly, then leaves
    clearTimeout(st.close);
    st.close = setTimeout(() => {
      setTip(null);
      setClosing(false);
    }, 200);
  }

  function quiet() {
    return (
      muted ||
      open ||
      document.querySelector("dialog[open]") ||
      document.body.hasAttribute("data-story-playing") ||
      document.activeElement?.matches?.("input, textarea, select, [contenteditable]")
    );
  }

  function present(key, target, top, now, text = d.tips[key], life = TIP_LIFE) {
    const st = state.current;
    if (key) st.shown.add(key);
    st.last = now;
    st.target = target;
    st.visible = true;
    st.shownY = window.scrollY;
    clearTimeout(st.close);
    setClosing(false);
    setTip({ text, top, key });
    setNod((n) => n + 1);
    clearTimeout(st.hide);
    st.hide = setTimeout(() => fns.current.hideTip(), life);
  }

  // Place the card beside Dalil, opening toward the content, never over the pointed element or the navbar.
  function showTip(key, target, now) {
    if (!d.tips[key]) return;
    const badge = badgeRef.current?.getBoundingClientRect();
    if (!badge) return;
    const nav = 64 + 12;
    const h = 110;
    const r = target.getBoundingClientRect();
    const rtl = lang === "ar";
    const covers = (box) => box.left < r.right && box.right > r.left && box.top < r.bottom && box.bottom > r.top;
    if (!wide) {
      // docked: the card opens above the button in the corner
      const left = rtl ? badge.left : badge.right - 280;
      if (!covers({ left, right: left + 280, top: badge.top - 12 - h, bottom: badge.top - 12 })) present(key, target, null, now);
      return;
    }
    const left = rtl ? badge.right + 12 : badge.left - 300;
    const right = left + 288;
    let top = Math.min(Math.max(badge.top + badge.height / 2 - h / 2, nav), innerHeight - h - 16);
    if (covers({ left, right, top, bottom: top + h })) {
      const above = r.top - h - 12;
      const below = r.bottom + 12;
      if (above >= nav) top = above;
      else if (below + h <= innerHeight - 16) top = below;
      else return; // nowhere to put it without covering the element
    }
    present(key, target, top, now);
  }

  useEffect(() => {
    fns.current = { hideTip, showTip, quiet, open, present };
  });

  // Arriving at a section shows its tip on its own, once per visit (kept for the browser session).
  useEffect(() => {
    const st = state.current;
    if (muted || !current) return;
    let seen = [];
    try {
      seen = JSON.parse(sessionStorage.getItem("dalil-arrived") || "[]");
    } catch {}
    const key = SECTIONS.find((x) => x.id === current)?.tip;
    if (!key || seen.includes(key) || st.arrived.has(key)) return;
    // on the very first visit the greeting speaks for the hero
    if (key === "top" && !store.get("dalil-greeted")) return;
    st.arrived.add(key);
    clearTimeout(st.arrive);
    const wait = Math.max(ARRIVE_DELAY, st.last + TIP_GAP - Date.now());
    st.arrive = setTimeout(() => {
      if (fns.current.quiet()) {
        st.arrived.delete(key); // try again on the next arrival
        return;
      }
      try {
        sessionStorage.setItem("dalil-arrived", JSON.stringify([...seen, key]));
      } catch {}
      const heading = document.getElementById(`${current}-title`) || document.getElementById(current);
      if (heading) fns.current.showTip(key, heading, Date.now());
    }, wait);
    return () => clearTimeout(st.arrive);
  }, [current, muted]);

  // Scroll progress, the section in view, and the ticks' positions on the rail.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - innerHeight;
      setProgress(max > 0 ? Math.min(1, scrollY / max) : 0);
      const line = innerHeight * 0.35;
      let cur = "top";
      const list = [];
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        list.push({ ...s, at: max > 0 ? Math.min(1, Math.max(0, (top - 80) / max)) : 0 });
        if (el.getBoundingClientRect().top <= line) cur = s.id;
      }
      if (innerHeight + scrollY >= doc.scrollHeight - 4 && list.length) cur = list.at(-1).id;
      // place the ticks on the rail in pixels, never closer than 26px (24px targets plus a gap)
      const railH = innerHeight - 92 - 28;
      let prev = -Infinity;
      for (const t of list) {
        t.y = Math.max(t.at * (railH - 24), prev + 26);
        prev = t.y;
      }
      const over = prev - (railH - 24);
      if (over > 0) for (const t of list) t.y = Math.max(0, t.y - over * (t.y / prev));
      setCurrent(cur);
      setTicks(list);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
      // a tip hides once the visitor scrolls on
      if (state.current.visible && Math.abs(window.scrollY - state.current.shownY) > SCROLL_HIDE) fns.current.hideTip();
    };
    raf = requestAnimationFrame(measure);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Pointer resting on a [data-tip] element (fine pointers only), and Escape.
  useEffect(() => {
    const s = state.current;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    function onMove(e) {
      const el = e.target.closest?.("[data-tip]");
      clearTimeout(s.timer);
      if (!el) return;
      const key = el.getAttribute("data-tip");
      if (s.shown.has(key) || s.visible || Date.now() - s.last < TIP_GAP) return;
      s.timer = setTimeout(() => {
        if (!fns.current.quiet()) fns.current.showTip(key, el, Date.now());
      }, TIP_DELAY);
    }
    function onKey(e) {
      if (e.key !== "Escape") return;
      fns.current.hideTip();
      if (fns.current.open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (fine) document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("keydown", onKey);
      clearTimeout(s.timer);
    };
  }, []);

  // One greeting on the first visit.
  useEffect(() => {
    if (store.get("dalil-greeted")) return;
    const id = setTimeout(() => {
      store.set("dalil-greeted", "1");
      if (store.get("dalil-muted") === "1") return;
      fns.current.present(null, null, null, Date.now(), d.greeting, TIP_LIFE + 2000);
    }, 1600);
    return () => clearTimeout(id);
  }, [d.greeting]);

  // The glyph leans up to 2px toward the cursor. Its only liveliness.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let p = null;
    const apply = () => {
      raf = 0;
      const g = glyphRef.current;
      const b = badgeRef.current?.getBoundingClientRect();
      if (!g || !b || !p) return;
      const dx = p.x - (b.left + b.width / 2);
      const dy = p.y - (b.top + b.height / 2);
      const len = Math.hypot(dx, dy) || 1;
      g.style.transform = `translate(${((dx / len) * 2).toFixed(2)}px, ${((dy / len) * 2).toFixed(2)}px)`;
    };
    const onMove = (e) => {
      p = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => removeEventListener("pointermove", onMove);
  }, []);

  // Panel: focus goes in, Escape closes, focus returns.
  useEffect(() => {
    if (!open) return;
    fns.current.hideTip?.();
    panelRef.current?.querySelector("button, a")?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };
  const idx = ticks.findIndex((s) => s.id === current);
  const nextSection = ticks[idx + 1];
  const currentTip = d.tips[SECTIONS.find((s) => s.id === current)?.tip || "top"];
  const sectionName = (s) => (s.key ? t.nav[s.key] : t.nav.home);
  const toggleMute = () => {
    const v = !muted;
    store.set("dalil-muted", v ? "1" : "0");
    window.dispatchEvent(new Event(MUTE_EVENT));
    if (v) hideTip();
  };

  // Badge position: on the rail on wide screens, docked in the corner otherwise.
  const RAIL_TOP = 64 + 28;
  const RAIL_BOTTOM = 28;
  const railStyle = wide ? { top: RAIL_TOP, bottom: RAIL_BOTTOM } : undefined;
  const travel = wide ? `calc(${progress} * (100vh - ${RAIL_TOP + RAIL_BOTTOM + 44}px))` : "0px";
  const circ = 2 * Math.PI * 25;

  const badge = (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-controls="dalil-panel"
      aria-label={d.button}
      title={d.name}
      className="pointer-events-auto relative grid size-11 place-items-center rounded-full border border-line bg-surface shadow-[var(--shadow)] transition-[border-color] hover:border-accent"
    >
      <span aria-hidden="true" className="dalil-breathe" />
      {!wide ? (
        <svg aria-hidden="true" className="absolute -inset-[5px] size-[54px] -rotate-90" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="25" fill="none" stroke="var(--line)" strokeWidth="2" />
          <circle
            cx="27"
            cy="27"
            r="25"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            strokeLinecap="round"
            style={lang === "ar" ? { transform: "scaleY(-1)", transformOrigin: "center" } : undefined}
          />
        </svg>
      ) : null}
      <svg ref={glyphRef} aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative transition-transform duration-150">
        <path d="M12 2.5 14.6 9.4 21.5 12l-6.9 2.6L12 21.5l-2.6-6.9L2.5 12l6.9-2.6Z" fill="var(--accent)" />
        <circle cx="12" cy="12" r="2" fill="var(--surface)" />
      </svg>
    </button>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40" data-dalil="">
      {/* the rail (wide screens) */}
      {wide ? (
        <nav ref={railRef} aria-label={d.rail} className="pointer-events-none absolute end-2 w-6" style={railStyle}>
          <span aria-hidden="true" className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2" />
          {onHome
            ? ticks.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  aria-label={d.goTo(sectionName(s))}
                  title={sectionName(s)}
                  aria-current={current === s.id ? "true" : undefined}
                  className="group pointer-events-auto absolute start-1/2 grid size-6 -translate-x-1/2 place-items-center rtl:translate-x-1/2"
                  style={{ top: s.y }}
                >
                  <span aria-hidden="true" className="block h-0.5 w-3 rounded bg-muted/60 transition-all group-hover:w-4 group-hover:bg-ink group-aria-[current=true]:w-4 group-aria-[current=true]:bg-accent" />
                </button>
              ))
            : null}
        </nav>
      ) : null}

      {/* Dalil itself */}
      <div
        ref={badgeRef}
        className={wide ? "absolute end-[34px]" : "absolute bottom-5 end-5"}
        style={wide ? { top: RAIL_TOP, transform: `translateY(${travel})`, transition: "transform 450ms cubic-bezier(.34,1.35,.64,1)" } : undefined}
      >
        <div key={nod} className={nod ? "dalil-nod" : undefined}>
          {badge}
        </div>
      </div>

      {/* the tip card */}
      {tip && !open ? (
        <div
          data-closing={closing ? "" : undefined}
          className={`dalil-bubble pointer-events-auto absolute w-[min(280px,calc(100vw-40px))] rounded-[14px] border border-line bg-surface p-4 text-[14.5px] leading-snug shadow-[var(--shadow-lift)] ${
            wide ? "end-[90px]" : "bottom-[80px] end-5"
          }`}
          style={{
            ...(wide ? { top: tip.top ?? RAIL_TOP } : {}),
            "--bubble-origin": wide ? (lang === "ar" ? "left center" : "right center") : lang === "ar" ? "bottom left" : "bottom right",
          }}
        >
          <p className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1 size-2 shrink-0 rotate-45 bg-accent" />
            <span>{tip.text}</span>
          </p>
        </div>
      ) : null}
      {/* tips are announced politely to screen readers */}
      <p className="sr-only" aria-live="polite">
        {tip && !open ? tip.text : ""}
      </p>

      {/* the panel */}
      <div
        id="dalil-panel"
        ref={panelRef}
        hidden={!open}
        className={`pointer-events-auto absolute w-[min(320px,calc(100vw-40px))] rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-lift)] ${
          wide ? "end-[90px] top-[100px]" : "bottom-[80px] end-5"
        }`}
      >
        <div aria-live="polite">
          <p className="text-[13px] font-semibold text-accent">{d.panelTitle}</p>
          <p className="mt-3 text-[12.5px] font-semibold text-muted">{d.here}</p>
          <p className="mt-1 leading-snug">{muted ? d.muted : currentTip}</p>
          <p className="mt-2 text-[12.5px] text-muted">{d.progress(Math.round(progress * 100))}</p>
        </div>
        <p className="mt-4 text-[12.5px] font-semibold text-muted">{d.shortcuts}</p>
        <ul className="mt-2 grid gap-1.5">
          {onHome ? (
            <li>
              <button type="button" className="btn w-full justify-start" onClick={() => (nextSection ? go(nextSection.id) : go("top"))}>
                {nextSection ? `${d.nextSection}: ${sectionName(nextSection)}` : d.top}
              </button>
            </li>
          ) : null}
          <li>
            <a href={cvHref} download className="btn w-full justify-start">
              {d.downloadCv}
            </a>
          </li>
          <li>
            <button type="button" className="btn w-full justify-start" onClick={() => goToOtherLang(lang, pathname)}>
              {d.switchLang}
            </button>
          </li>
          <li>
            <button type="button" className="btn w-full justify-start" aria-pressed={muted} onClick={toggleMute}>
              {muted ? d.unmute : d.mute}
            </button>
          </li>
        </ul>
        <button
          type="button"
          className="link mt-3 min-h-11 text-[14px]"
          onClick={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
        >
          {d.close}
        </button>
      </div>
    </div>
  );
}
