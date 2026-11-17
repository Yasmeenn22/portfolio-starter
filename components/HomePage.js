import { getCv, cvEn } from "@/data/cv";
import { getUi } from "@/data/ui";
import { bidi, Ltr } from "@/lib/bidi";
import { cvHref } from "@/lib/paths";
import Section from "@/components/Section";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Certifications from "@/components/Certifications";
import Recognition from "@/components/Recognition";
import MediaCards from "@/components/MediaCards";
import Gallery from "@/components/Gallery";
import Board from "@/components/Board";
import { boardItems } from "@/lib/board";
import LinkIcon from "@/components/LinkIcon";
import { calli } from "@/lib/fonts-calli";
import workshop from "@/assets/yara/gallery/workshop.jpg";
import keynote from "@/assets/yara/gallery/keynote.jpg";
import panel from "@/assets/yara/gallery/panel.jpg";
import fireside from "@/assets/yara/gallery/fireside.jpg";

const PHOTOS = { workshop, keynote, panel, fireside };

export default function HomePage({ lang }) {
  const cv = getCv(lang);
  const t = getUi(lang);
  const items = boardItems(cv, lang);
  // the CV's own words for her calligraphy, shown under the sign-off
  const calligraphy = cv.interests[cvEn.interests.findIndex((x) => x.title === "Arabic calligraphy")];

  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero lang={lang} />

      <Section id="gallery" lang={lang} title={t.gallery.title} lead={t.gallery.lead} tip="gallery" alt reveal="scale">
        <Gallery lang={lang} photos={t.gallery.photos.map((p) => ({ ...p, src: PHOTOS[p.file] }))} />
      </Section>

      <About lang={lang} />

      <Section id="experience" lang={lang} title={t.experience.title} lead={t.experience.lead} tip="experience" alt reveal="slide">
        <Experience lang={lang} roles={cv.experience} />
      </Section>

      <Section id="projects" lang={lang} title={t.projects.title} lead={t.projects.lead} tip="projects" reveal="wipe">
        <Projects lang={lang} projects={cv.projects.map((p, i) => ({ ...p, domain: cvEn.projects[i].domain }))} />
      </Section>

      <Section id="education" lang={lang} title={t.education.title} tip="education" alt reveal="slide">
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {cv.education.map((e, i) => (
            <li key={i} id={`edu-${i}`} tabIndex={-1} className="card spot flex flex-col p-6" data-reveal="">
              <p className="text-[14px] tabular-nums text-muted">{e.period}</p>
              <h3 className="h3 mt-2">{bidi(e.degree, lang)}</h3>
              <p className="mt-1">
                <span className="font-medium">{bidi(e.school, lang)}</span>
                <span className="text-muted"> · {bidi(e.place, lang)}</span>
              </p>
              <ul className="mt-4 grid gap-1.5 border-t border-line pt-4 text-[15px]">
                {e.details.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-accent-2" />
                    <span>{bidi(d, lang)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-14" data-tip="certifications">
          <h3 className="h3">{t.education.certifications}</h3>
          <Certifications lang={lang} items={cv.certifications} note={cv.certificationsNote} />
        </div>
      </Section>

      <Section id="recognition" lang={lang} title={t.recognition.title} tip="recognition" reveal="scale">
        <Recognition
          lang={lang}
          awards={cv.awards}
          patents={cv.patents}
          publications={cv.publications}
          publicationsNote={cv.publicationsNote}
          publicationsLink={cv.publicationsLink}
        />
      </Section>

      <Section id="speaking" lang={lang} title={t.speaking.title} tip="speaking" alt>
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="h3">{t.speaking.talks}</h3>
          <p className="text-[14px] text-muted">{cv.talksNote}</p>
        </div>
        <ol className="card mt-4 divide-y divide-line">
          {cv.talks.map((x, i) => (
            <li key={i} id={`talk-${i}`} tabIndex={-1} className="grid gap-x-6 gap-y-1 p-4 md:grid-cols-12 md:items-baseline md:px-5">
              <p className="md:col-span-2">
                <span className="badge">{x.type}</span>
              </p>
              <p className="font-semibold leading-snug md:col-span-5">{lang === "ar" ? `«${x.title}»` : `“${x.title}”`}</p>
              <p className="text-[15px] md:col-span-3">{bidi(x.event, lang)}</p>
              <p className="text-[15px] text-muted md:col-span-2 md:text-end">
                {x.city} · <span className="tabular-nums">{x.year}</span>
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-14" data-tip="media">
          <h3 className="h3">{t.speaking.media}</h3>
          <p className="mt-1 text-muted">{t.speaking.mediaLead}</p>
          <MediaCards lang={lang} media={cv.media} />
        </div>
      </Section>

      <Section id="beyond" lang={lang} title={t.board.title} lead={t.board.lead} tip="beyond" reveal="scale">
        <Board lang={lang} items={items} leadershipNote={cv.leadershipNote} />
      </Section>

      <Section id="contact" lang={lang} title={t.contact.title} lead={t.contact.lead} tip="contact" alt reveal="slide">
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="card p-6 md:p-8 lg:col-span-5" data-reveal="">
            <dl className="grid gap-5">
              <div>
                <dt className="text-[13px] font-semibold text-muted">{t.contact.email}</dt>
                <dd className="mt-1 text-[1.15rem] font-semibold">
                  <a href={`mailto:${cv.contact.email}`} className="link">
                    <Ltr>{cv.contact.email}</Ltr>
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold text-muted">{t.contact.phone}</dt>
                <dd className="mt-1">
                  <a href={cv.contact.phoneHref} className="link">
                    <Ltr>{cv.contact.phone}</Ltr>
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold text-muted">{t.contact.location}</dt>
                <dd className="mt-1">{cv.location}</dd>
              </div>
            </dl>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={`mailto:${cv.contact.email}`} className="btn btn-primary">
                {t.contact.emailCta}
              </a>
              <a href={cvHref(cv)} download className="btn">
                {t.cv.download}
                {lang === "ar" ? <span className="text-[13px] font-medium text-muted">({t.cv.note})</span> : null}
              </a>
            </div>
          </div>
          <ul aria-label={t.contact.profiles} className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-7">
            {cv.links.map((l) => (
              <li key={l.key} data-reveal="">
                <a href={l.url} rel="me noopener" className="card card-link spot flex min-h-16 items-center gap-3 p-4 text-ink no-underline">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-surface-2">
                    <LinkIcon k={l.key} size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{bidi(l.label, lang)}</span>
                    <Ltr className="block truncate text-[14px] text-muted">{l.display}</Ltr>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* The ending of "two directions": the hero's two lines return from both sides and meet,
            then her first name is written in calligraphy as a sign-off (decorative, aria-hidden). */}
        <div className="closing mt-16 md:mt-20" data-stage="">
          <div className="meet" dir="ltr" aria-hidden="true">
            <span className="meet-a" />
            <span className="meet-dot" />
            <span className="meet-b" />
          </div>
          <p aria-hidden="true" lang="ar" dir="rtl" className={`${calli.variable} calli pen pen-sign mx-auto`}>
            {cvEn.nameAr.split(" ")[0]}
          </p>
          {calligraphy ? <p className="mt-1 text-center text-[13.5px] text-muted">{bidi(calligraphy.line, lang)}</p> : null}
        </div>
      </Section>
    </main>
  );
}
