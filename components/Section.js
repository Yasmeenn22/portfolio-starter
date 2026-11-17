import SplitHeading from "@/components/SplitHeading";

// Every home section uses this, so spacing and headings are identical everywhere.
// Signature ("designs in two directions"): under each title a calligraphic ink stroke draws
// itself, then a hairline guide runs on in the reading direction (mirrored in Arabic).
// The title is also wiped in from the reading start (left in English, right in Arabic).
// `reveal` sets how this section's content enters: "rise" (default), "slide", "scale" or "wipe".
// Every entrance replays each time it scrolls back into view (components/MotionRoot.js).
export default function Section({ id, lang, title, lead, tip, alt = false, reveal = "rise", children }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-tip={tip}
      data-reveal-style={reveal}
      className={`section ${alt ? "section-alt" : ""}`}
    >
      <div className="wrap">
        <header className="max-w-3xl">
          <SplitHeading id={`${id}-title`} text={title} lang={lang} className="h2" />
          <InkRule />
          {lead ? (
            <p className="lead mt-4" data-reveal="">
              {lead}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}

// One brush-like stroke (a nod to her Arabic calligraphy) and a guide line.
export function InkRule() {
  return (
    <div className="ink-rule" data-draw="" aria-hidden="true">
      <svg className="ink" width="132" height="16" viewBox="0 0 132 16" fill="none">
        <path pathLength="1" d="M3 11.5C18 4.5 33 3 47 7.5S73 14 88 9.5s27-8 41-4" />
        <circle className="ink-dot" cx="128" cy="5" r="2.4" />
      </svg>
      <span className="ink-guide" />
    </div>
  );
}
