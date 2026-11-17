// Clicks through every feature of the built site, in English and Arabic:
//   npx -y -p playwright@1.56.1 node scripts/qa-interact.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const roots = (process.env.PATH || "").split(path.delimiter).map((p) => path.resolve(p, "..", ".."));
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd(), ...roots] }));

const OUT = path.resolve("out");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".pdf": "application/pdf", ".txt": "text/plain" };
const server = createServer(async (req, res) => {
  let file = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end(await readFile(path.join(OUT, "404.html")));
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
for (const channel of ["chrome", "msedge", undefined]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}

let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${String(e.message).split("\n")[0]}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

async function open(pathname, { width = 1440, reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("dalil-greeted", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  page.setDefaultNavigationTimeout(45000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + pathname, { waitUntil: "networkidle" });
  page.errors = errors;
  return page;
}

for (const lang of ["en", "ar"]) {
  const root = lang === "ar" ? "/ar/" : "/";
  const L = (en, ar) => (lang === "ar" ? ar : en);

  await check(`${lang}: Tab reaches the skip link first`, async () => {
    const p = await open(root);
    await p.keyboard.press("Tab");
    assert(await p.evaluate(() => document.activeElement.classList.contains("skip-link")), "first Tab did not land on the skip link");
    await p.context().close();
  });

  await check(`${lang}: mobile menu opens, closes on Escape, returns focus`, async () => {
    const p = await open(root, { width: 390 });
    const btn = p.locator('button[aria-controls="site-menu"]');
    await btn.click();
    assert((await btn.getAttribute("aria-expanded")) === "true", "aria-expanded not true");
    assert(await p.locator("#site-menu").isVisible(), "menu not visible");
    await p.keyboard.press("Escape");
    assert((await btn.getAttribute("aria-expanded")) === "false", "menu did not close");
    assert(await p.evaluate(() => document.activeElement.getAttribute("aria-controls") === "site-menu"), "focus did not return");
    await btn.click();
    await p.locator("#site-menu a").nth(2).click();
    await p.waitForTimeout(400);
    assert(!(await p.locator("#site-menu").isVisible()), "menu did not close on link click");
    await p.context().close();
  });

  await check(`${lang}: experience filters and expand all`, async () => {
    const p = await open(root);
    await p.locator("#experience [role=group] button").nth(3).click(); // Startups
    assert((await p.locator('#experience li[id^="exp-"]').count()) === 2, "Startups should show 2 roles");
    await p.locator("#experience [role=group] button").nth(0).click();
    assert((await p.locator('#experience li[id^="exp-"]').count()) === 12, "All should show 12 roles");
    await p.locator("#experience button.link").click();
    assert((await p.locator('#experience [id^="exp-body-"]:visible').count()) === 12, "Expand all did not open 12 roles");
    await p.context().close();
  });

  await check(`${lang}: journey link opens the matching role`, async () => {
    const p = await open(root);
    await p.locator('#about a[href="#exp-zayna-director"]').click();
    await p.waitForTimeout(500);
    assert(await p.locator("#exp-body-zayna-director").isVisible(), "role did not open");
    await p.context().close();
  });

  await check(`${lang}: skill explorer highlights Figma proofs`, async () => {
    const p = await open(root);
    await p.locator("#about button.chip", { hasText: "Figma" }).click();
    await p.waitForTimeout(500);
    const lit = await p.locator("#about li.-translate-y-\\[3px\\]").count();
    const dim = await p.locator("#about li.opacity-\\[\\.28\\]").count();
    assert(lit === 2 && dim > 0, `expected 2 highlighted and some dimmed, got ${lit}/${dim}`);
    await p.context().close();
  });

  await check(`${lang}: project filter and a project page with previous/next`, async () => {
    const p = await open(root);
    await p.locator("#projects [role=group] button").nth(1).click(); // Fintech
    assert((await p.locator("#projects article").count()) === 2, "Fintech should show 2 projects");
    await p.locator("#projects article a").first().click();
    await p.waitForURL(/mizan-design-system/);
    await p.locator('nav a[href*="national-telemedicine-platform"]').click();
    await p.waitForURL(/national-telemedicine-platform/);
    assert(await p.locator("h1").isVisible(), "project page has no heading");
    assert((await p.locator("html").getAttribute("dir")) === L("ltr", "rtl"), "wrong dir on project page");
    await p.context().close();
  });

  await check(`${lang}: certifications search and status filter`, async () => {
    const p = await open(root);
    await p.fill("#cert-search", "HLC-MPA");
    assert((await p.locator('#education li[id^="cert-"]').count()) === 1, "search should leave 1");
    await p.fill("#cert-search", "");
    await p.locator('#education [role=group] button').nth(3).click(); // Expired
    assert((await p.locator('#education li[id^="cert-"]').count()) === 3, "Expired should show 3");
    await p.context().close();
  });

  await check(`${lang}: recognition tabs with keyboard`, async () => {
    const p = await open(root);
    await p.locator("#rec-tab-awards").focus();
    await p.keyboard.press(L("ArrowRight", "ArrowLeft"));
    assert(await p.locator("#rec-panel-patents").isVisible(), "arrow key did not open Patents");
    await p.locator("#rec-tab-publications").click();
    assert((await p.locator('#rec-panel-publications li[id^="pub-"]').count()) === 6, "6 publications expected");
    await p.context().close();
  });

  await check(`${lang}: media dialog plays, closes on Escape, removes the iframe, returns focus`, async () => {
    const p = await open(root);
    await p.locator("#media-2 button").click();
    const dlg = p.locator("dialog");
    assert(await dlg.isVisible(), "dialog not open");
    const src = await p.locator("dialog iframe").getAttribute("src");
    assert(src.includes("youtube-nocookie.com/embed/"), "iframe src wrong");
    await p.keyboard.press("Escape");
    await p.waitForTimeout(200);
    assert(!(await dlg.isVisible()), "dialog still open");
    assert((await p.locator("dialog iframe").count()) === 0, "iframe not removed");
    assert(await p.evaluate(() => !!document.activeElement.closest("#media-2")), "focus did not return to the card");
    await p.context().close();
  });

  await check(`${lang}: gallery next button and arrow keys`, async () => {
    const p = await open(root);
    await p.locator("#gallery").scrollIntoViewIfNeeded();
    await p.locator(`#gallery button[aria-label="${L("Next photo", "الصورة التالية")}"]`).click();
    await p.waitForTimeout(1500);
    const cur = await p.locator('#gallery button[aria-current="true"]').getAttribute("aria-label");
    assert(cur.includes("2"), `expected photo 2, got ${cur}`);
    await p.locator("#gallery [tabindex='0']").focus();
    await p.keyboard.press(L("ArrowRight", "ArrowLeft"));
    await p.waitForTimeout(1500);
    const cur2 = await p.locator('#gallery button[aria-current="true"]').getAttribute("aria-label");
    assert(cur2.includes("3"), `expected photo 3, got ${cur2}`);
    await p.context().close();
  });

  await check(`${lang}: the gallery comes right after the hero`, async () => {
    const p = await open(root);
    const ids = await p.evaluate(() => [...document.querySelectorAll("main > section")].map((x) => x.id));
    assert(ids[0] === "top" && ids[1] === "gallery" && ids[2] === "about", ids.join(","));
    await p.context().close();
  });

  await check(`${lang}: The Board: tap a piece, play the story, next, list view, checkmate`, async () => {
    const p = await open(root);
    const board = p.locator("#beyond");
    await board.scrollIntoViewIfNeeded();
    // tap a piece: its card shows the CV line
    await board.locator('.grid-cols-8 button[aria-pressed="false"]').first().click();
    assert(/1 \/ 15/.test(await board.innerText()), "tapping a piece should discover 1 / 15");
    // play the story: the knight reaches the first stops on its own
    await board.locator("button.btn-primary").click();
    await p.waitForTimeout(2900);
    assert(await p.evaluate(() => document.body.hasAttribute("data-story-playing")), "story should be playing");
    await board.locator("button.btn-primary").click(); // pause
    // next until the end
    for (let i = 0; i < 16; i++) {
      const next = board.locator("button.btn:not(.btn-primary)", { hasText: L("Next", "التالي") });
      if (await next.isDisabled()) break;
      await next.click();
    }
    const text = await board.innerText();
    assert(/15 \/ 15/.test(text), "all 15 should be discovered");
    assert(text.includes(L("Checkmate", "كش ملك")), "checkmate line missing");
    // keyboard: arrows move between squares
    await board.locator('[role="group"] button[tabindex="0"]').focus();
    const before = await p.evaluate(() => document.activeElement.getAttribute("aria-label"));
    await p.keyboard.press("ArrowDown");
    const after = await p.evaluate(() => document.activeElement.getAttribute("aria-label"));
    assert(before !== after, "arrow key did not move focus");
    // list view
    await board.locator("button.chip", { hasText: L("View as list", "اعرض كقائمة") }).click();
    assert((await board.locator('li[id^="lead-"], li[id^="lang-"], li[id^="interest-"]').count()) === 15, "list view should show 15 items");
    await p.context().close();
  });

  await check(`${lang}: Dalil speaks on its own when a section is reached`, async () => {
    const p = await open(root);
    await p.waitForTimeout(2500); // Dalil mounts when the browser is idle
    await p.evaluate(() => document.getElementById("experience").scrollIntoView());
    await p.waitForTimeout(1600);
    const text = await p.locator(".dalil-bubble").innerText();
    assert(text.includes(L("Zayna", "Zayna")), `expected the Experience tip, got "${text}"`);
    await p.context().close();
  });

  await check(`${lang}: Dalil panel opens, mutes, closes on Escape`, async () => {
    const p = await open(root);
    const btn = p.locator('button[aria-controls="dalil-panel"]');
    await btn.click();
    assert(await p.locator("#dalil-panel").isVisible(), "panel not visible");
    await p.locator('#dalil-panel button[aria-pressed]').click();
    assert(await p.evaluate(() => localStorage.getItem("dalil-muted") === "1"), "mute not saved");
    await p.keyboard.press("Escape");
    assert(!(await p.locator("#dalil-panel").isVisible()), "panel did not close");
    await p.context().close();
  });

  await check(`${lang}: language switch keeps the section`, async () => {
    const p = await open(root + "#projects");
    await p.locator("header a[hreflang]").first().click();
    await p.waitForURL(/#projects$/);
    assert(p.url().includes(L("/ar/#projects", "/#projects")), `landed on ${p.url()}`);
    await p.context().close();
  });

  await check(`${lang}: reduced motion shows everything at once`, async () => {
    const p = await open(root, { reduced: true });
    const hidden = await p.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((e) => getComputedStyle(e).opacity !== "1").length);
    assert(hidden === 0 && !(await p.evaluate(() => document.documentElement.classList.contains("motion-ok"))), `${hidden} elements hidden under reduced motion`);
    await p.context().close();
  });

  await check(`${lang}: no console errors on home and a project page`, async () => {
    const p = await open(root);
    await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(800);
    const q = await open(`${root}projects/hirfa-ui/`);
    const errs = [...p.errors, ...q.errors];
    assert(errs.length === 0, errs.join(" | "));
    await p.context().close();
    await q.context().close();
  });
}

await check("Download CV serves the PDF", async () => {
  const p = await open("/");
  const href = await p.locator("header a[download]").getAttribute("href");
  const r = await fetch(base + href);
  assert(r.ok && r.headers.get("content-type") === "application/pdf", `${href} -> ${r.status}`);
  await p.context().close();
});

await check("Unknown URL shows the bilingual 404", async () => {
  const p = await open("/nope/");
  const t = await p.locator("body").innerText();
  assert(t.includes("404") && t.includes("هذه الصفحة غير موجودة"), "404 page missing text");
  await p.context().close();
});

await browser.close();
server.close();
console.log(failed ? `\n${failed} checks failed` : "\nAll interaction checks passed.");
process.exit(failed ? 1 : 0);
