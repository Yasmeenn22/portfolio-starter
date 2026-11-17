import { getCv } from "@/data/cv";
import { getUi } from "@/data/ui";
import { buildSkillExplorer } from "@/lib/proofs";
import { bidi } from "@/lib/bidi";
import Section from "@/components/Section";
import CountUp from "@/components/CountUp";
import Journey from "@/components/Journey";
import SkillExplorer from "@/components/SkillExplorer";

export default function About({ lang }) {
  const cv = getCv(lang);
  const t = getUi(lang).about;
  const { areas, cards } = buildSkillExplorer(lang);
  return (
    <Section id="about" lang={lang} title={t.title} tip="about" alt>
      <p className="mt-6 max-w-[68ch] text-[1.15rem] leading-[1.75]" data-reveal="">
        {bidi(cv.summary, lang)}
      </p>

      <div className="mt-14" data-tip="about">
        <h3 className="h3">{t.highlights}</h3>
        <ul className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {cv.highlights.map((h) => (
            <li key={h.text} className="card flex flex-col gap-3 p-5" data-reveal="">
              <CountUp value={h.stat} className="text-[2.4rem] font-bold leading-none tracking-tight text-accent" />
              <span className="text-[15px] leading-snug">{bidi(h.text, lang)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 grid gap-x-12 gap-y-2 lg:grid-cols-12" data-tip="journey">
        <div className="lg:col-span-4">
          <h3 className="h3">{t.journey}</h3>
          <p className="mt-2 text-muted">{t.journeyLead}</p>
        </div>
        <div className="lg:col-span-8 lg:-mt-8">
          <Journey items={cv.journey} lang={lang} now={t.now} openLabel={t.journeyOpen} />
        </div>
      </div>

      <div className="mt-16" data-tip="skills">
        <h3 className="h3">{t.skills}</h3>
        <p className="mt-2 text-muted">{t.skillsLead}</p>
        <SkillExplorer lang={lang} areas={areas} cards={cards} />
      </div>
    </Section>
  );
}
