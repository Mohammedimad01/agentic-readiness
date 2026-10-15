// Lighthouse audits for both locales, mobile and desktop.
// Chromium is launched through Playwright (with a remote-debugging port) and Lighthouse
// connects to it, so no separate Chrome install is needed.
// Usage: npm run build && npm run preview -- --port 4330   (in another terminal)
//        node scripts/lighthouse.mjs [baseUrl]
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.argv[2] || 'http://localhost:4330';
const OUT = new URL('../verification/lighthouse/', import.meta.url);
await mkdir(OUT, { recursive: true });

const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const rows = [];
let ok = true;

for (const lang of ['en', 'ar']) {
  for (const form of ['mobile', 'desktop']) {
    const result = await lighthouse(
      `${BASE}/${lang}/readiness/`,
      { port: PORT, output: ['html', 'json'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] },
      form === 'desktop' ? desktopConfig : undefined,
    );
    const [html, json] = result.report;
    await writeFile(new URL(`${lang}-${form}.html`, OUT), html);
    await writeFile(new URL(`${lang}-${form}.json`, OUT), json);
    const c = result.lhr.categories;
    const s = (k) => Math.round(c[k].score * 100);
    rows.push(`${lang}-${form}`.padEnd(12) + ` performance ${s('performance')}  accessibility ${s('accessibility')}  best-practices ${s('best-practices')}  seo ${s('seo')}`);
    if (['performance', 'accessibility', 'best-practices'].some((k) => s(k) < 95)) ok = false;
    // List anything that failed, for fixing.
    for (const cat of Object.values(c)) {
      for (const ref of cat.auditRefs) {
        const a = result.lhr.audits[ref.id];
        if (ref.weight > 0 && a.score != null && a.score < 0.9) rows.push(`    ${cat.id}: ${a.id} (${a.score}) ${a.displayValue ?? ''}`);
      }
    }
  }
}
await browser.close();
const summary = rows.join('\n');
console.log(summary);
await writeFile(new URL('summary.txt', OUT), summary + '\n');
process.exit(ok ? 0 : 1);
