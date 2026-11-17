import Link from "next/link";
import { getCv } from "@/data/cv";
import { getUi } from "@/data/ui";
import { bidi, Ltr } from "@/lib/bidi";
import { localePath } from "@/lib/paths";
import { techIcon } from "@/lib/icons";
import BrandIcon from "@/components/BrandIcon";
import SplitHeading from "@/components/SplitHeading";

// Emphasise the numbers inside a result line ("38%", "3.1 million", "SAR 2,300").
function emphasise(text, lang) {
  const parts = text.split(/(\d[\d,.]*\s?(?:%|million|مليون)?)/);
  return parts.map((p, i) =>
    i % 2 ? (
      <strong key={i} className="font-bold text-accent">
        <bdi dir="ltr">{p}</bdi>
      </strong>
    ) : (
      <span key={i}>{bidi(p, lang)}</span>
    ),
  );
}

const Arrow = ({ back }) => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flip-rtl">
    <path d={back ? "M19 12H5m0 0 6-6m-6 6 6 6" : "M5 12h14m0 0-6-6m6 6-6 6"} />
  </svg>
);

export default function ProjectPage({ lang, slug }) {
  const cv = getCv(lang);
  const t = getUi(lang).projects;
  const i = cv.projects.findIndex((p) => p.slug === slug);
  const p = cv.projects[i];
  const n = cv.projects.length;
  const prev = cv.projects[(i - 1 + n) % n];
  const next = cv.projects[(i + 1) % n];
  const facts = [
    [t.org, p.org],
    [t.role, p.role],
    [t.team, p.team],
    [t.dates, p.period],
  ].filter(([, v]) => v);
  const steps = [
    ["problem", p.problem],
    ["action", p.action],
    ["result", p.result],
  ];

  return (
    <main id="main" tabIndex={-1} className="pb-20 pt-10 outline-none md:pt-14">
      <article className="wrap">
        <Link href={`${localePath(lang, "/")}#projects`} className="link inline-flex min-h-11 items-center gap-2 text-[15px] text-muted">
          <Arrow back />
          {t.back}
        </Link>

        <header className="mt-6 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="flex flex-wrap items-center gap-3">
              <span className="badge">{t.domains[getCv("en").projects[i].domain]}</span>
              <span className="text-[14px] text-muted">{t.of(i + 1, n)}</span>
            </p>
            <SplitHeading as="h1" text={p.name} lang={lang} className="h1 mt-4 !text-[clamp(2.1rem,4.6vw,3.4rem)]" />
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {facts.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[13px] font-semibold text-muted">{k}</dt>
                  <dd className="mt-1 leading-snug">{bidi(v, lang)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card flex flex-col justify-end p-7 lg:col-span-5" data-reveal="">
            <p dir="ltr" className="text-start text-[clamp(2.6rem,6vw,4.2rem)] font-bold leading-none tracking-tight text-accent rtl:text-end">
              {p.metric.value}
            </p>
            <p className="mt-3 text-[1.1rem]">{bidi(p.metric.label, lang)}</p>
          </div>
        </header>

        <ol className="mt-12 grid gap-4 lg:grid-cols-3">
          {steps.map(([k, v], s) => (
            <li key={k} className={`card relative flex flex-col p-6 md:p-7 ${k === "result" ? "!border-accent !bg-accent-soft" : ""}`} data-reveal="">
              <p className="flex items-center gap-3 text-[14px] font-semibold text-muted">
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full border border-current text-[13px]">
                  {s + 1}
                </span>
                {t[k]}
              </p>
              <p className="mt-4 text-[1.15rem] leading-relaxed">{k === "result" ? emphasise(v, lang) : bidi(v, lang)}</p>
              {s < 2 ? (
                <span aria-hidden="true" className="absolute -end-3 top-1/2 z-[1] hidden size-6 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg text-muted lg:grid">
                  <Arrow />
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <section aria-labelledby="tech-title" className="mt-12 grid gap-6 border-t border-line pt-8 lg:grid-cols-12">
          <h2 id="tech-title" className="h3 lg:col-span-3">
            {t.technologies}
          </h2>
          <div className="lg:col-span-9">
            <ul className="flex flex-wrap gap-2">
              {p.tech.map((x) => (
                <li key={x} className="tag !px-3 !py-1.5 !text-[15px]" dir="ltr">
                  <BrandIcon icon={techIcon(x)} size={18} />
                  {x}
                </li>
              ))}
            </ul>
            {p.link ? (
              <p className="mt-5">
                {t.source}:{" "}
                <a href={p.link.url} className="link">
                  <Ltr>{p.link.label}</Ltr>
                </a>
              </p>
            ) : null}
          </div>
        </section>

        <nav aria-label={t.title} className="mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          <Link href={localePath(lang, `/projects/${prev.slug}/`)} className="card card-link flex items-center gap-4 p-5 text-ink no-underline">
            <Arrow back />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-muted">{t.previous}</span>
              <span className="block font-semibold">{bidi(prev.name, lang)}</span>
            </span>
          </Link>
          <Link href={localePath(lang, `/projects/${next.slug}/`)} className="card card-link flex items-center justify-end gap-4 p-5 text-end text-ink no-underline">
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-muted">{t.next}</span>
              <span className="block font-semibold">{bidi(next.name, lang)}</span>
            </span>
            <Arrow />
          </Link>
        </nav>
      </article>
    </main>
  );
}
