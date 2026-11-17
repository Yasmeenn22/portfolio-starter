// npm run check: fails if the CV data is incomplete or the two languages drift apart.
// Plain Node, no dependencies.
import { cvEn, cvAr } from "../data/cv.js";
import { ui } from "../data/ui.js";

const errors = [];
const fail = (msg) => errors.push(msg);

// 1. Counts from the CV (the contract in the brief).
const counts = {
  links: 8, highlights: 8, skills: 10, experience: 12, projects: 8, education: 4,
  certifications: 20, awards: 10, patents: 2, publications: 6, talks: 8, media: 4,
  leadership: 6, languages: 5, interests: 4,
};
const statusTotals = { Active: 9, Lifetime: 7, Expired: 3, "In progress": 1 };

for (const [lang, cv] of [["en", cvEn], ["ar", cvAr]]) {
  for (const [key, n] of Object.entries(counts)) {
    const got = cv[key]?.length;
    if (got !== n) fail(`${lang}: ${key} has ${got}, the CV has ${n}`);
  }
  if (cv.headline?.length !== 3) fail(`${lang}: the headline needs 3 parts`);
  for (const [status, n] of Object.entries(statusTotals)) {
    const got = cv.certifications.filter((c) => c.status === status).length;
    if (got !== n) fail(`${lang}: ${got} certifications are ${status}, the CV has ${n}`);
  }
  if (lang === "en" && !cv.highlights.every((h) => h.text.includes(h.stat))) fail(`${lang}: a highlight's number is not in its text`);
}

// 2. English and Arabic have the same shape, the same array lengths and no empty strings.
function compare(a, b, path) {
  const ta = Array.isArray(a) ? "array" : a === null ? "null" : typeof a;
  const tb = Array.isArray(b) ? "array" : b === null ? "null" : typeof b;
  if (ta !== tb) return fail(`${path}: ${ta} in English, ${tb} in Arabic`);
  if (ta === "string") {
    if (!a.trim()) fail(`${path}: empty in English`);
    if (!b.trim()) fail(`${path}: empty in Arabic`);
  } else if (ta === "array") {
    if (a.length !== b.length) return fail(`${path}: ${a.length} items in English, ${b.length} in Arabic`);
    a.forEach((v, i) => compare(v, b[i], `${path}[${i}]`));
  } else if (ta === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (!(k in a)) fail(`${path}.${k}: missing in English`);
      else if (!(k in b)) fail(`${path}.${k}: missing in Arabic`);
      else compare(a[k], b[k], `${path}.${k}`);
    }
  }
}
compare(cvEn, cvAr, "cv");
compare(ui.en, ui.ar, "ui");

// 3. The game: 15 checkpoints, three options each, a valid answer.
for (const lang of ["en", "ar"]) {
  const cps = ui[lang].game.checkpoints;
  if (cps.length !== 15) fail(`${lang}: the game has ${cps.length} checkpoints, needs 15`);
  cps.forEach((c, i) => {
    if (c.options.length !== 3 || !(c.answer >= 0 && c.answer < 3)) fail(`${lang}: checkpoint ${i + 1} needs 3 options and a valid answer`);
  });
}

if (errors.length) {
  console.error(`CV check failed (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}
const rows = Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(" · ");
console.log(`CV check passed in English and Arabic: ${rows} · certifications by status 9/7/3/1`);
