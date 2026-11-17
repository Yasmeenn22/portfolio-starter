// postbuild: two small fixes to the static export that GitHub Pages cannot do for us.
//
// 1. Next 16's static export writes route-group payloads as nested folders
//    (out/x/__next.!KGVuKQ/projects/$d$slug/__PAGE__.txt) while the browser asks for the dotted
//    name (out/x/__next.!KGVuKQ.projects.$d$slug.__PAGE__.txt). Pages has no rewrites, so we add a
//    copy under the dotted name. Without it, next/link prefetches log 404 errors.
//
// 2. With two root layouts Next shares one font-preload list, so the Arabic font is not preloaded
//    (it would load on the English pages too). Here we add preload links for the Arabic 400 and
//    700 faces to the Arabic pages only, so Arabic text gets its font as early as English does.
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

// 2. Arabic font preloads on /ar/ pages
const cssDir = path.join(OUT, "_next", "static", "chunks");
const faces = new Set();
for (const f of await readdir(cssDir)) {
  if (!f.endsWith(".css")) continue;
  const css = await readFile(path.join(cssDir, f), "utf8");
  const re = /@font-face\{font-family:IBM Plex Sans Arabic;[^}]*?font-weight:(\d+);[^}]*?src:url\(\.\.\/media\/([^)]+\.woff2)\)[^}]*?unicode-range:U\+6\?\?/g;
  for (const m of css.matchAll(re)) if (m[1] === "400" || m[1] === "700") faces.add(m[2]);
}
const links = [...faces]
  .map((file) => `<link rel="preload" href="${BASE}/_next/static/media/${file}" as="font" type="font/woff2" crossorigin=""/>`)
  .join("");
let pages = 0;
if (links) {
  for (const f of await filesUnder(path.join(OUT, "ar"))) {
    if (!f.endsWith(".html")) continue;
    const html = await readFile(f, "utf8");
    if (html.includes(links)) continue;
    await writeFile(f, html.replace("</title>", `</title>${links}`));
    pages++;
  }
}

console.log(`fix-export: ${copied} dotted payload copies; Arabic font preloads (${faces.size}) added to ${pages} pages`);
