import SplitHeading from "@/components/SplitHeading";

// Every home section uses this, so spacing and headings are identical everywhere.
export default function Section({ id, lang, title, lead, tip, alt = false, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} data-tip={tip} className={`section ${alt ? "section-alt" : ""}`}>
      <div className="wrap">
        <header className="max-w-3xl">
          <SplitHeading id={`${id}-title`} text={title} lang={lang} className="h2" />
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
