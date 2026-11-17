// postbuild: two small fixes to the static export that GitHub Pages cannot do for us.
//
// 1. Next 16's static export writes route-group payloads as nested folders
//    (out/x/__next.!KGVuKQ/projects/$d$slug/__PAGE__.txt) while the browser asks for the dotted
//    name (out/x/__next.!KGVuKQ.projects.$d$slug.__PAGE__.txt). Pages has no rewrites, so we add a
//    copy under the dotted name. Without it, next/link prefetches log 404 errors.
//
// 2. With two root layouts Next shares one font-preload list, so the Arabic font is not preloaded
//    by Next (it would load every weight on the English pages too). Here each page gets preload
//    links for exactly the Arabic faces it uses.
import { readdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

async function filesUnder(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await filesUnder(p)));
    else out.push(p);
  }
  return out;
}

// 1. dotted payload copies
let copied = 0;
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("__next.")) {
      for (const f of await filesUnder(p)) {
        const rel = path.relative(p, f).split(path.sep).join(".");
        const target = path.join(dir, `${e.name}.${rel}`);
        try {
          await stat(target);
        } catch {
          await copyFile(f, target);
          copied++;
        }
      }
    } else if (e.name !== "_next") {
      await walk(p);
    }
  }
}
await walk(OUT);

// 2. Arabic font preloads, per page. The Arabic face uses font-display: optional (no late swap that
//    re-lays out the whole page), so it must arrive early: each page preloads the Arabic faces its own
//    stylesheets declare. English pages need weight 600 (her Arabic name, the language switch);
//    Arabic pages need 400, 600 and 700.
const cssCache = new Map();
async function arabicFaces(cssHref) {
  if (!cssCache.has(cssHref)) {
    const file = path.join(OUT, cssHref.replace(BASE, "").replace(/^\//, ""));
    let css = "";
    try {
      css = await readFile(file, "utf8");
    } catch {}
    const re = /@font-face\{font-family:IBM Plex Sans Arabic;[^}]*?font-weight:(\d+);[^}]*?src:url\(\.\.\/media\/([^)]+\.woff2)\)[^}]*?unicode-range:U\+6\?\?/g;
    cssCache.set(cssHref, [...css.matchAll(re)].map((m) => ({ weight: m[1], file: m[2] })));
  }
  return cssCache.get(cssHref);
}

let pages = 0;
for (const f of await filesUnder(OUT)) {
  if (!f.endsWith(".html") || f.includes(`${path.sep}_next${path.sep}`)) continue;
  let html = await readFile(f, "utf8");
  if (html.includes('data-arabic-preload')) continue;
  const arabicPage = /<html[^>]*lang="ar"/.test(html);
  const weights = arabicPage ? ["400", "600", "700"] : ["600"];
  const hrefs = [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map((m) => m[1]);
  const files = new Set();
  for (const h of hrefs) for (const face of await arabicFaces(h)) if (weights.includes(face.weight)) files.add(face.file);
  if (!files.size) continue;
  const links = [...files]
    .map((file) => `<link rel="preload" href="${BASE}/_next/static/media/${file}" as="font" type="font/woff2" crossorigin="" data-arabic-preload=""/>`)
    .join("");
  html = html.replace("</title>", `</title>${links}`);
  await writeFile(f, html);
  pages++;
}

console.log(`fix-export: ${copied} dotted payload copies; Arabic font preloads added to ${pages} pages`);
