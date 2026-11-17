// Clicks through every feature of the built site, in English and Arabic, including the
// Round 3 motion (replay down/up, headings, odometers), Dalil's arrivals and the calligraphy:
//   npx -y -p playwright@1.56.1 node scripts/qa-interact.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { ui } from "../data/ui.js";

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

  // ── Round 3: motion that replays ─────────────────────────────
  const scrollToEl = (p, sel, offset = 0.3) =>
    p.evaluate(
      ([sel, offset]) => {
        const el = document.querySelector(sel);
        scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * offset, behavior: "instant" });
      },
      [sel, offset],
    );
  // reveal elements on screen that are still (nearly) invisible once motion has settled
  const stuckOnScreen = (p) =>
    p.evaluate(() =>
      [...document.querySelectorAll("[data-reveal], [data-split] .split-piece")].filter((el) => {
        const r = el.getBoundingClientRect();
        const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= Math.min(r.height * 0.1, 40);
        return el.offsetParent !== null && r.height > 0 && seen && parseFloat(getComputedStyle(el).opacity) < 0.99;
      }).length,
    );

  await check(`${lang}: reveals replay down, up and down again, nothing stuck invisible`, async () => {
    const p = await open(root);
    const card = "#projects li[data-reveal]";
    await scrollToEl(p, card);
    await p.waitForTimeout(1300);
    assert((await p.locator(card).first().getAttribute("data-in")) === "", "card did not reveal on the way down");
    assert((await p.locator(card).first().getAttribute("data-dir")) === "down", "first entry should be direction down");
    assert((await stuckOnScreen(p)) === 0, "something on screen is stuck invisible (1st pass)");
    await scrollToEl(p, "#contact", 0);
    await p.waitForTimeout(600);
    assert((await p.locator(card).first().getAttribute("data-in")) === null, "card should reset once it left the screen");
    await scrollToEl(p, card, 0.3);
    await p.waitForTimeout(80);
    assert((await p.locator(card).first().getAttribute("data-dir")) === "up", "coming back from below should be direction up");
    await p.waitForTimeout(1700);
    assert((await stuckOnScreen(p)) === 0, "something on screen is stuck invisible (scrolling up)");
    await scrollToEl(p, "#top", 0);
    await p.waitForTimeout(400);
    await scrollToEl(p, card);
    await p.waitForTimeout(1300);
    assert((await p.locator(card).first().getAttribute("data-dir")) === "down", "third pass should be direction down");
    assert((await stuckOnScreen(p)) === 0, "something on screen is stuck invisible (3rd pass)");
    // nothing anywhere is stuck: visit every section in turn
    for (const id of ["gallery", "about", "experience", "projects", "education", "recognition", "speaking", "beyond", "contact"]) {
      await scrollToEl(p, `#${id}`, 0.1);
      await p.waitForTimeout(1700); // the longest stagger (14 × 55ms) plus its 0.75s entrance
      const n = await stuckOnScreen(p);
      assert(n === 0, `${n} elements stuck invisible in #${id}`);
    }
    await p.context().close();
  });

  await check(`${lang}: section heading replays (${L("letters", "words")}) and the hero never blinks away`, async () => {
    const p = await open(root);
    const heroBefore = await p.evaluate(() => getComputedStyle(document.querySelector("#top-title")).opacity);
    const h = p.locator("#experience-title");
    await scrollToEl(p, "#experience-title");
    await p.waitForTimeout(150);
    assert((await h.getAttribute("data-in")) === "", "heading not revealed");
    const pieces = await p.locator("#experience-title .split-piece").count();
    const title = ui[lang].experience.title;
    const want = lang === "ar" ? title.split(" ").length : title.replace(/ /g, "").length;
    assert(pieces === want, `expected ${want} pieces (${L("one per letter", "one per word")}), got ${pieces}`);
    await scrollToEl(p, "#contact", 0);
    await p.waitForTimeout(400);
    assert((await h.getAttribute("data-in")) === null, "heading did not reset off screen");
    await scrollToEl(p, "#experience-title");
    await p.waitForTimeout(1500);
    assert((await h.getAttribute("data-in")) === "", "heading did not replay");
    const op = await p.evaluate(() => Math.min(...[...document.querySelectorAll("#experience-title .split-piece")].map((e) => +getComputedStyle(e).opacity)));
    assert(op === 1, "heading pieces not fully visible after replay");
    await scrollToEl(p, "#top", 0);
    await p.waitForTimeout(300);
    const heroAfter = await p.evaluate(() => [getComputedStyle(document.querySelector("#top-title")).opacity, document.querySelector("#top [data-in]")?.getAttribute("data-in") ?? "none"]);
    assert(heroBefore === "1" && heroAfter[0] === "1", "hero heading must stay visible");
    await p.context().close();
  });

  await check(`${lang}: highlights roll up again on re-entry and end on the exact CV text`, async () => {
    const p = await open(root);
    const stat = "#about li .odo";
    const read = () =>
      p.evaluate((sel) =>
        [...document.querySelectorAll(sel)].map((odo) => {
          const sr = odo.querySelector(".sr-only").textContent;
          // the digits as drawn: each column's resting place on its 0–9 strip
          const face = [...odo.querySelector(".odo-face").children]
            .map((c) => {
              if (!c.classList.contains("odo-col")) return c.textContent;
              const strip = c.firstElementChild;
              const y = new DOMMatrix(getComputedStyle(strip).transform).m42;
              return String(Math.round(-y / c.getBoundingClientRect().height) % 10);
            })
            .join("");
          return [sr, face];
        }),
      stat);
    await scrollToEl(p, stat, 0.4);
    await p.waitForTimeout(2200);
    const first = await read();
    assert(first.length === 8, `expected 8 highlights, got ${first.length}`);
    for (const [sr, face] of first) assert(sr === face, `drawn "${face}" differs from CV text "${sr}"`);
    assert(["16", "40+", "1,400+"].every((v) => first.some(([sr]) => sr === v)), "CV numbers missing");
    await scrollToEl(p, "#contact", 0);
    await p.waitForTimeout(400);
    const reset = await p.evaluate(() => getComputedStyle(document.querySelector("#about li .odo-strip")).transform);
    assert(reset === "none", "odometer did not reset off screen");
    await scrollToEl(p, stat, 0.4);
    await p.waitForTimeout(300);
    const mid = await p.evaluate(() => getComputedStyle(document.querySelector("#about li .odo-strip")).transform);
    assert(mid !== "none", "odometer is not rolling on re-entry");
    await p.waitForTimeout(2000);
    for (const [sr, face] of await read()) assert(sr === face, `after replay drawn "${face}" differs from "${sr}"`);
    await p.context().close();
  });

  await check(`${lang}: journey line fills going down and empties going up`, async () => {
    const p = await open(root);
    const fill = () => p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector("#about ol").previousElementSibling).transform).d);
    await scrollToEl(p, "#about ol", 0.9);
    await p.waitForTimeout(200);
    const a = await fill();
    await scrollToEl(p, "#about ol", 0.2);
    await p.waitForTimeout(200);
    const b = await fill();
    await scrollToEl(p, "#about ol", 0.9);
    await p.waitForTimeout(200);
    const c = await fill();
    assert(b > a + 0.2 && c < b - 0.2, `fill should rise then fall: ${a.toFixed(2)} → ${b.toFixed(2)} → ${c.toFixed(2)}`);
    await p.context().close();
  });

  // ── Round 3: Dalil on every arrival ──────────────────────────
  const tips = ui[lang].dalil.tips;
  const bubble = (p) => p.evaluate(() => document.querySelector(".dalil-bubble:not([data-closing])")?.innerText.trim() || "");
  const waitBubble = async (p, list, ms = 4000) => {
    for (let t = 0; t < ms; t += 200) {
      const text = await bubble(p);
      if (list.includes(text)) return text;
      await p.waitForTimeout(200);
    }
    throw new Error(`expected one of ${JSON.stringify(list).slice(0, 80)}…, got "${await bubble(p)}"`);
  };
  const dalilPage = async (opts) => {
    const p = await open(root, opts);
    await p.waitForTimeout(2600); // Dalil mounts when the browser is idle
    return p;
  };

  await check(`${lang}: Dalil speaks on every arrival (down, up, menu), rotating its tips`, async () => {
    const p = await dalilPage();
    assert((await bubble(p)) === "", "the hero should stay clear on load");
    await scrollToEl(p, "#experience", 0.1);
    const e1 = await waitBubble(p, tips.experience);
    await scrollToEl(p, "#projects", 0.1);
    await p.waitForTimeout(2200);
    const p1 = await waitBubble(p, tips.projects);
    await scrollToEl(p, "#experience", 0.1); // back up
    await p.waitForTimeout(2200);
    const e2 = await waitBubble(p, tips.experience);
    assert(e1 !== e2, "coming back should give a fresh tip");
    // the navbar on wide screens
    await p.waitForTimeout(2200);
    await p.locator(`header nav a[href="#contact"]`).click();
    const c1 = await waitBubble(p, tips.contact, 5000);
    assert(c1 !== p1, "two different bubbles");
    assert(await p.evaluate(() => !!document.querySelector('[aria-live="polite"].sr-only')?.textContent), "tip not in the live region");
    await p.context().close();
  });

  await check(`${lang}: Dalil speaks after the mobile menu and docks compact on a phone`, async () => {
    const p = await dalilPage({ width: 390 });
    await p.locator('button[aria-controls="site-menu"]').click();
    await p.locator('#site-menu a[href="#projects"]').click();
    await waitBubble(p, tips.projects, 5000);
    const box = await p.evaluate(() => {
      const b = document.querySelector(".dalil-bubble").getBoundingClientRect();
      const d = document.querySelector('button[aria-controls="dalil-panel"]').getBoundingClientRect();
      return { w: b.width, h: b.height, bottomGap: Math.abs(innerHeight - b.bottom), nearDalil: Math.abs(b.bottom - d.bottom) < 40, top: b.top };
    });
    assert(box.w <= 240 && box.h <= 110 && box.nearDalil && box.top > 64, `bubble not compact/docked: ${JSON.stringify(box)}`);
    await p.context().close();
  });

  await check(`${lang}: a Dalil bubble stays 15 s while scrolling in the section, then goes`, async () => {
    const p = await dalilPage();
    await scrollToEl(p, "#experience", 0.1);
    const text = await waitBubble(p, tips.experience);
    const t0 = Date.now();
    for (let i = 0; i < 6; i++) {
      await p.mouse.wheel(0, 120); // keep reading inside the same section
      await p.waitForTimeout(1500);
    }
    assert(await p.evaluate(() => document.querySelector("#experience").getBoundingClientRect().top < innerHeight * 0.35), "left the section");
    await p.waitForTimeout(Math.max(0, 12500 - (Date.now() - t0)));
    assert((await bubble(p)) === text, "bubble should still be up at 12.5 s");
    const bar = await p.evaluate(() => getComputedStyle(document.querySelector(".dalil-life")).animationDuration);
    assert(bar === "15s", `life bar should run 15s, got ${bar}`);
    await p.waitForTimeout(3600);
    assert((await bubble(p)) === "", "bubble should be gone after 15 s");
    await p.context().close();
  });

  await check(`${lang}: Dalil bubble closes on × and on Escape`, async () => {
    const p = await dalilPage();
    await scrollToEl(p, "#projects", 0.1);
    await waitBubble(p, tips.projects);
    await p.locator(`.dalil-bubble button[aria-label="${ui[lang].dalil.closeTip}"]`).click();
    await p.waitForTimeout(400);
    assert((await bubble(p)) === "", "× did not close the bubble");
    await scrollToEl(p, "#education", 0.1);
    await waitBubble(p, tips.education, 5000);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    assert((await bubble(p)) === "", "Escape did not close the bubble");
    await p.context().close();
  });

  await check(`${lang}: Dalil stays silent while a video is open, and when muted`, async () => {
    const p = await dalilPage();
    await scrollToEl(p, "#speaking", 0.1);
    await waitBubble(p, tips.speaking);
    await p.locator("#media-1 button").click();
    await p.waitForTimeout(400);
    assert((await bubble(p)) === "", "bubble should step away when the video opens");
    await scrollToEl(p, "#beyond", 0.1); // an arrival behind the open video
    await p.waitForTimeout(2500);
    assert((await bubble(p)) === "", "Dalil spoke while the video was open");
    await p.keyboard.press("Escape");
    await p.waitForTimeout(300);
    // mute, then arrive somewhere new: silence, and it is remembered
    await p.locator('button[aria-controls="dalil-panel"]').click();
    await p.locator("#dalil-panel button[aria-pressed]").click();
    await p.keyboard.press("Escape");
    await scrollToEl(p, "#contact", 0.1);
    await p.waitForTimeout(2500);
    assert((await bubble(p)) === "", "Dalil spoke while muted");
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(2600);
    await scrollToEl(p, "#projects", 0.1);
    await p.waitForTimeout(2000);
    assert((await bubble(p)) === "" && (await p.evaluate(() => localStorage.getItem("dalil-muted"))) === "1", "mute was not remembered");
    await p.context().close();
  });

  // ── Round 3: calligraphy ─────────────────────────────────────
  await check(`${lang}: calligraphy in the hero and the sign-off, hidden from screen readers`, async () => {
    const p = await open(root);
    await scrollToEl(p, "#contact .closing", 0.5);
    await p.waitForTimeout(2600);
    const r = await p.evaluate(() => {
      const els = [...document.querySelectorAll(".calli")];
      return els.map((el) => ({
        hidden: el.closest('[aria-hidden="true"]') === el,
        font: getComputedStyle(el).fontFamily,
        text: el.textContent.trim(),
        realName: el.parentElement.querySelector(".sr-only")?.textContent || null,
        loaded: document.fonts.check(`700 32px ${getComputedStyle(el).fontFamily.split(",")[0]}`, el.textContent),
        opaque: getComputedStyle(el).getPropertyValue("--pen"),
      }));
    });
    assert(r.length === 2, `expected 2 calligraphy elements, got ${r.length}`);
    assert(r.every((x) => x.hidden && /Aref Ruqaa/.test(x.font) && x.loaded), "calligraphy must be aria-hidden, in Aref Ruqaa and loaded");
    assert(r.every((x) => x.opaque === "120%"), `pen reveal did not finish: ${r.map((x) => x.opaque)}`);
    assert(r[0].realName === r[0].text && r[0].text.includes("يارا سعود المنصوري"), "the real name must sit beside the hero calligraphy as plain text");
    const used = await p.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => /Aref Ruqaa/.test(getComputedStyle(e).fontFamily) && !e.closest(".calli")).length);
    assert(used === 0, `${used} other elements use the calligraphy font`);
    await p.context().close();
  });

  await check(`${lang}: reduced motion: no animations, everything visible`, async () => {
    const p = await open(root, { reduced: true });
    await p.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({
      running: document.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "life" && (a.effect.getTiming().duration > 1 || a.timeline?.constructor?.name === "ViewTimeline")).map((a) => a.animationName),
      hidden: [...document.querySelectorAll("[data-reveal], .split-piece, .board-piece, .calli")].filter((e) => getComputedStyle(e).opacity !== "1").length,
      pen: [...document.querySelectorAll(".calli")].map((e) => getComputedStyle(e).getPropertyValue("--pen")),
    }));
    assert(r.running.length === 0, `animations still running: ${r.running.join(", ")}`);
    assert(r.hidden === 0 && r.pen.every((v) => v === "120%"), `hidden: ${r.hidden}, pen: ${r.pen}`);
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
