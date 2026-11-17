// Layout check for the built site (run `npm run build` first):
//   npx -y -p playwright@1.56.1 node scripts/qa.mjs
// Playwright is fetched by npx, not added to package.json. It drives the Chrome or Edge
// already installed on this machine. Serves out/ on 127.0.0.1, then at 360…1920px,
// in English and Arabic, light and dark, fails when:
//   the page is wider than the screen · a section overlaps the next one ·
//   a reveal element is still invisible after scrolling · the console shows an error.
// Full-page screenshots go to .qa/shots/.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const roots = (process.env.PATH || "").split(path.delimiter).map((p) => path.resolve(p, "..", ".."));
  return require(require.resolve("playwright", { paths: [process.cwd(), ...roots] }));
}
const { chromium } = loadPlaywright();

const OUT = path.resolve("out");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".pdf": "application/pdf", ".ico": "image/x-icon", ".txt": "text/plain", ".json": "application/json" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(OUT, p);
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
  } catch {
    file = path.join(OUT, "404.html");
    res.statusCode = 404;
  }
  try {
    res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const WIDTHS = (process.env.QA_WIDTHS || "360,390,768,1024,1280,1440,1920").split(",").map(Number);
const PAGES = (process.env.QA_PAGES || "/,/ar/").split(",");
const THEMES = (process.env.QA_THEMES || "light,dark").split(",");
await mkdir(".qa/shots", { recursive: true });

let browser;
for (const channel of ["chrome", "msedge", undefined]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}
if (!browser) throw new Error("No Chrome, Edge or Playwright Chromium found");

const failures = [];
for (const page of PAGES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 800 : 900 }, colorScheme: theme });
      const tab = await ctx.newPage();
      const errors = [];
      tab.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
      tab.on("pageerror", (e) => errors.push(e.message));
      tab.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url().replace(base, "")}`));
      await tab.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
          localStorage.setItem("dalil-greeted", "1");
        } catch {}
      }, theme);
      await tab.goto(base + page, { waitUntil: "load", timeout: 90000 });
      await tab.waitForTimeout(800);
      // scroll through the page so every reveal fires
      await tab.evaluate(async () => {
        const step = innerHeight * 0.6;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((r) => setTimeout(r, 2600)); // let the last reveals finish
      });
      const report = await tab.evaluate(() => {
        const out = [];
        const doc = document.documentElement;
        if (doc.scrollWidth > innerWidth + 1) {
          const wide = [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== "fixed")
            .filter((el) => ![...el.children].some((c) => c.getBoundingClientRect().right > innerWidth + 1))
            .slice(0, 3)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`);
          out.push(`page is ${doc.scrollWidth}px wide on a ${innerWidth}px screen (${wide.join(", ")})`);
        }
        const sections = [...document.querySelectorAll("main > section, main > article, body > footer")];
        for (let i = 0; i < sections.length - 1; i++) {
          const a = sections[i].getBoundingClientRect();
          const b = sections[i + 1].getBoundingClientRect();
          if (a.bottom > b.top + 1) out.push(`#${sections[i].id || sections[i].tagName} overlaps #${sections[i + 1].id || sections[i + 1].tagName} by ${Math.round(a.bottom - b.top)}px`);
        }
        const stuck = [...document.querySelectorAll("[data-reveal], [data-split] .split-piece")].filter((el) => el.offsetParent !== null && parseFloat(getComputedStyle(el).opacity) < 0.99);
        if (stuck.length) out.push(`${stuck.length} reveal elements still invisible, first: ${stuck[0].outerHTML.slice(0, 90)}`);
        return out;
      });
      for (const e of errors) report.push(`console: ${e.slice(0, 160)}`);
      const name = `${page === "/" ? "en" : "ar"}-${theme}-${width}`;
      await tab.evaluate(() => scrollTo(0, 0));
      await tab.screenshot({ path: `.qa/shots/${name}.png`, fullPage: true });
      console.log(`${report.length ? "FAIL" : "ok  "} ${name}${report.length ? "\n     - " + report.join("\n     - ") : ""}`);
      if (report.length) failures.push(name);
      await ctx.close();
    }
  }
}
await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} runs failed: ${failures.join(", ")}` : "\nAll layout checks passed.");
process.exit(failures.length ? 1 : 0);
