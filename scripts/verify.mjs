// End-to-end verification of the built site (dist/).
// Serves dist/ locally, then with headless Chromium:
//  - screenshots EN and AR at 360, 390, 768, 1280 and 1440px into verification/
//  - checks for horizontal scroll and console errors at every width
//  - asserts the worked-example figures on the rendered page
//  - exercises the interactions: clear, example, live update, language switch, #ar, #note, Esc, backdrop, keyboard
// Usage: npm run build && node scripts/verify.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const OUT = fileURLToPath(new URL('../verification/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };

const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, '');
  let file = join(ROOT, p);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { /* 404 below */ }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((r) => server.listen(4319, r));
const BASE = 'http://localhost:4319';
await mkdir(OUT, { recursive: true });

const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg); };

const browser = await chromium.launch();

/* ---------- screenshots + overflow + console ---------- */
for (const lang of ['en', 'ar']) {
  for (const width of [360, 390, 768, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/${lang}/readiness/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check(sw <= width, `${lang}@${width}: no horizontal scroll (scrollWidth ${sw})`);
    check(errors.length === 0, `${lang}@${width}: no console errors ${errors.join(' | ')}`);
    if ([390, 1440].includes(width)) {
      await page.screenshot({ path: join(OUT, `${lang}-${width}.png`) });
      await page.screenshot({ path: join(OUT, `${lang}-${width}-full.png`), fullPage: true });
    }
    if (width === 360) await page.screenshot({ path: join(OUT, `${lang}-360-full.png`), fullPage: true });
    await page.close();
  }
}

/* ---------- worked example on the rendered page ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/en/readiness/`, { waitUntil: 'networkidle' });
  const txt = async (sel) => (await page.locator(sel).first().evaluate((e) => e.textContent || '')).replace(/\s+/g, ' ').trim();
  check((await txt('#score .ring-num')) === '52', 'example: score 52');
  check((await txt('#score .band')) === 'Ready for a scoped pilot', 'example: band');
  check((await txt('#tier .tier-name')) === 'Compact', 'example: Compact tier');
  const roi = await txt('#roi');
  check(roi.includes('1,440') && roi.includes('100,800') && roi.includes('0.8') && roi.includes('7–11'), `example: ROI stats (${roi})`);
  const handoff = await page.locator('#handoff').textContent();
  check(handoff.includes('Lead priority: B · process audit, then a pilot proposal'), 'example: priority B in summary');
  check((await txt('#gaps')).match(/1\/3/g)?.length === 4, 'example: four gaps');
  const term = await txt('#term-rows');
  check(term.includes('52') && term.includes('Compact') && term.includes('AED 100,800') && term.includes('7–11'), 'example: hero terminal');
  check((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'), 'noindex meta present');
  check(await page.locator('.proto-bar').isVisible(), 'prototype disclosure visible');
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(300);
  check(await page.locator('.proto-bar').isVisible() && (await page.locator('.proto-bar').boundingBox()).y <= 1, 'disclosure stays visible after scroll');

  /* ---------- interactions ---------- */
  await page.click('#btn-blank');
  check((await txt('#score .ring-num')) === '—', 'clear: score resets to —');
  check((await txt('#notice-text')).startsWith('These are your answers'), 'clear: notice switches to own answers');
  check((await txt('#roi')).includes('Add the numbers'), 'clear: ROI asks for numbers');
  for (const q of ['q1-d', 'q2-d', 'q3-d', 'q4-d', 'q5-airgap', 'q6-d', 'q7-d']) await page.check(`#${q}`, { force: true });
  check((await txt('#score .ring-num')) === '100', 'live: all 3s give 100');
  check((await txt('#tier .tier-name')) === 'Sovereign', 'live: air-gapped data gives Sovereign');
  await page.selectOption('#f-systems', '2-3');
  await page.click('label[for="wf-reporting"]');
  check(await page.locator('#wf-reporting').isChecked(), 'clicking a workflow tile selects it');
  check((await page.inputValue('#f-share')) === '60', 'workflow sets its default share (60%)');
  await page.fill('#f-people', '6'); await page.fill('#f-hours', '10'); await page.fill('#f-rate', '80');
  check((await txt('#roi')).includes('from'), 'live: open-ended payback shows "from"');
  await page.fill('#f-company', 'Test <b>Co</b>');
  check((await page.locator('#brief-eyebrow').textContent()).includes('Test <b>Co</b>') && (await page.locator('#brief-eyebrow b').count()) === 0, 'company name is escaped, not rendered as HTML');

  // language switch keeps the answers
  await page.click('.nav a[data-lang-switch="ar"]');
  await page.waitForURL('**/ar/readiness/**');
  await page.waitForLoadState('networkidle');
  check((await page.locator('html').getAttribute('dir')) === 'rtl', 'AR page is RTL');
  check((await txt('#score .ring-num')) === '100', 'language switch carries the answers');
  check((await page.inputValue('#f-company')) === 'Test <b>Co</b>', 'language switch carries the company name');
  check((await txt('#tier .tier-name')) === 'السيادي', 'AR tier name');
  await page.close();
}

/* ---------- AR worked example + hashes + dialog ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/readiness/#ar`, { waitUntil: 'networkidle' });
  check(page.url().includes('/ar/readiness'), '#ar opens the Arabic page');
  const roi = (await page.locator('#roi').textContent());
  check(roi.includes('من 7 إلى 11'), 'AR payback written in words');
  check((await page.locator('#tier dd').nth(1).textContent()).includes('من 60 إلى 90 ألف درهم'), 'AR investment written in words');
  // remembered language from the root entry
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check(page.url().includes('/ar/readiness'), 'root remembers Arabic (localStorage)');

  await page.goto(`${BASE}/en/readiness/#note`, { waitUntil: 'networkidle' });
  check(await page.locator('#note').evaluate((d) => d.open), '#note opens the builder\'s note');
  await page.screenshot({ path: join(OUT, 'en-1440-note.png') });
  await page.keyboard.press('Escape');
  check(!(await page.locator('#note').evaluate((d) => d.open)), 'Esc closes the note');
  await page.locator('.hero [data-open-note]').click();
  check(await page.locator('#note').evaluate((d) => d.open), 'button opens the note');
  // focus stays inside while tabbing
  let inside = true;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    inside = inside && (await page.evaluate(() => document.getElementById('note').contains(document.activeElement)));
  }
  check(inside, 'focus is trapped in the note');
  await page.mouse.click(10, 450); // backdrop
  check(!(await page.locator('#note').evaluate((d) => d.open)), 'backdrop click closes the note');

  // keyboard: skip link and radio groups
  await page.goto(`${BASE}/en/readiness/`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check((await page.evaluate(() => document.activeElement?.className)) === 'skip', 'first Tab reaches the skip link');
  await page.locator('#q1-c').focus();
  await page.keyboard.press('ArrowDown');
  check(await page.locator('#q1-d').isChecked(), 'arrow keys change a question answer');
  check((await page.locator('#score .ring-num').textContent()) === '57', 'keyboard answer updates the score (12/21 → 57)');
  await page.click('#btn-book');
  check((await page.locator('#copy-msg').textContent()).startsWith('Prototype: booking is not connected'), 'book shows prototype note');
  await ctx.close();
}

/* ---------- mobile bar ---------- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/en/readiness/`, { waitUntil: 'networkidle' });
  check(await page.locator('.mbar').isVisible(), 'mobile result bar visible at 390px');
  check((await page.locator('#mbar').textContent()).includes('52'), 'mobile bar shows the score');
  await page.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL CHECKS PASSED');
process.exit(failures.length ? 1 : 0);
