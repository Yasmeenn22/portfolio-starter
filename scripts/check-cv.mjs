// npm run check: fails if the CV data is incomplete or the two languages drift apart.
// Plain Node, no dependencies.
import { cvEn, cvAr } from "../data/cv.js";
import { ui } from "../data/ui.js";
import { boardItems, SQUARES, KNIGHT_HOME } from "../lib/board.js";

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

// 3. The Board: all 15 items, once each, each on its own square, in both languages.
for (const [lang, cv] of [["en", cvEn], ["ar", cvAr]]) {
  const items = boardItems(cv, lang);
  const groups = items.reduce((m, it) => ({ ...m, [it.group]: (m[it.group] || 0) + 1 }), {});
  if (items.length !== 15 || new Set(items.map((i) => i.id)).size !== 15) fail(`${lang}: the board needs 15 different items`);
  if (groups.languages !== 5 || groups.leadership !== 6 || groups.interests !== 4) fail(`${lang}: the board groups should be 5/6/4`);
  if (items.some((i) => !i.title)) fail(`${lang}: a board item has no title`);
}
const squares = SQUARES.map(([r, c]) => `${r},${c}`);
if (new Set(squares).size !== 15 || squares.includes(KNIGHT_HOME.join(",")) || SQUARES.some(([r, c]) => r < 0 || r > 7 || c < 0 || c > 7))
  fail("board squares must be 15 different squares on the board, none on the knight's home");

// 4. Dalil: every section has 2 or 3 tips in each language (rotated, never the same twice in a row).
const sectionTips = ["top", "gallery", "about", "experience", "projects", "education", "recognition", "speaking", "beyond", "contact"];
for (const key of sectionTips) {
  const en = ui.en.dalil.tips[key];
  const ar = ui.ar.dalil.tips[key];
  if (!Array.isArray(en) || en.length < 2 || en.length > 3) fail(`ui.en.dalil.tips.${key} needs 2 or 3 tips`);
  if (!Array.isArray(ar) || ar.length !== en?.length) fail(`ui.ar.dalil.tips.${key} needs the same number of tips as English`);
  if (new Set(en).size !== en?.length || new Set(ar).size !== ar?.length) fail(`dalil tips for ${key} repeat`);
}

if (errors.length) {
  console.error(`CV check failed (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}
const rows = Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(" · ");
console.log(`CV check passed in English and Arabic: ${rows} · certifications by status 9/7/3/1 · board 15 items · Dalil tips 2–3 per section`);
