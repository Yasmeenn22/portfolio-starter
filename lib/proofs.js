// Skill explorer: which CV entries prove which tool.
// A tool is tied to an entry only when that entry's own CV text names it
// (its Technologies line, a bullet, a title). Nothing is inferred.
import { cvEn, getCv } from "@/data/cv";
import { localePath } from "@/lib/paths";
import { withBase } from "@/lib/withBase";

const join = (...parts) => parts.flat().filter(Boolean).join(" · ");

// Every entry that can be a proof, with the English text it is matched against.
function sources(lang) {
  const cv = getCv(lang);
  const en = cvEn;
  return [
    ...en.experience.map((e, i) => ({
      id: `exp-${e.id}`, kind: "role", hash: true,
      text: [e.role, ...e.points, ...(e.tech || [])],
      title: cv.experience[i].role,
      sub: join(cv.experience[i].company, cv.experience[i].period),
    })),
    ...en.projects.map((p, i) => ({
      id: `proj-${p.slug}`, kind: "project",
      href: withBase(localePath(lang, `/projects/${p.slug}/`)),
      text: [p.name, p.problem, p.action, p.result, ...p.tech],
      title: cv.projects[i].name,
      sub: join(cv.projects[i].org, cv.projects[i].period),
    })),
    ...en.education.map((e, i) => ({
      id: `edu-${i}`, kind: "education", hash: true,
      text: [e.degree, ...e.details],
      title: cv.education[i].degree,
      sub: join(cv.education[i].school, cv.education[i].period),
    })),
    ...en.certifications.map((c, i) => ({
      id: `cert-${i}`, kind: "certification", hash: true,
      text: [c.name],
      title: cv.certifications[i].name,
      sub: join(cv.certifications[i].issuer, cv.certifications[i].year),
    })),
    ...en.patents.map((p, i) => ({
      id: `patent-${i}`, kind: "patent", hash: true,
      text: [p.title],
      title: cv.patents[i].title,
      sub: cv.patents[i].status,
    })),
    ...en.publications.map((p, i) => ({
      id: `pub-${i}`, kind: "publication", hash: true,
      text: [p.title],
      title: cv.publications[i].titleLocal,
      sub: join(p.authors, p.year),
    })),
    ...en.talks.map((t, i) => ({
      id: `talk-${i}`, kind: "talk", hash: true,
      text: [t.title],
      title: cv.talks[i].title,
      sub: join(cv.talks[i].event, cv.talks[i].city),
    })),
    ...en.media.map((m, i) => ({
      id: `media-${i}`, kind: "media", hash: true,
      text: [m.title, ...m.parts],
      title: cv.media[i].title,
      sub: join(cv.media[i].type, cv.media[i].parts[0]),
    })),
    ...en.leadership.map((l, i) => ({
      id: `lead-${i}`, kind: "leadership", hash: true,
      text: [l.role, l.detail],
      title: cv.leadership[i].role,
      sub: join(cv.leadership[i].org, cv.leadership[i].period),
    })),
  ];
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normal = (s) => s.replace(/[-‐]/g, " ");

function matcher(tool) {
  const name = normal(tool.replace(/\s*\(.*\)$/, "")); // "Swift (basic)" -> "Swift"
  // A plural tool also matches its singular: "design systems" -> "design system(s)"
  const plural = /[a-z]{3}s$/.test(name) && !name.includes(".");
  let pattern = plural ? `${escape(name.slice(0, -1))}s?` : escape(name);
  if (name === "React") pattern += String.raw`(?!\s*Native)`;
  const acronym = /[A-Z]{2,}/.test(name); // REST, SQL, AWS, WCAG: match case exactly
  return new RegExp(`(?<![A-Za-z0-9])${pattern}(?![A-Za-z0-9])`, acronym ? "" : "i");
}

// For one language: the skill areas with their tools and proof ids, plus every proof card.
export function buildSkillExplorer(lang) {
  const cv = getCv(lang);
  const src = sources(lang);
  const used = new Set();
  const areas = cvEn.skills.map((skill, a) => ({
    area: cv.skills[a].area,
    level: cv.skills[a].level,
    levelRank: { Intermediate: 1, Advanced: 2, Expert: 3 }[skill.level],
    years: skill.years,
    tools: skill.items.map((tool, j) => {
      const re = matcher(tool);
      const proofs = src.filter((s) => s.text.some((t) => re.test(normal(t)))).map((s) => s.id);
      proofs.forEach((id) => used.add(id));
      return { label: cv.skills[a].items[j], proofs };
    }),
  }));
  const cards = Object.fromEntries(
    src
      .filter((s) => used.has(s.id))
      .map(({ id, kind, title, sub, href, hash }) => [id, { kind, title, sub, href: href || `#${id}`, hash: !!hash }]),
  );
  return { areas, cards };
}
