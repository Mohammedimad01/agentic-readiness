// Builds side-by-side comparison sheets: hashinclu.de /automate (reference) next to this page,
// EN and AR, at 1440px and 390px. Run after scripts/verify.mjs (which makes the screenshots).
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ref = (f) => new URL(`../design-reference/${f}`, import.meta.url);
const ver = (f) => new URL(`../verification/${f}`, import.meta.url);
const img = async (u) => `data:image/png;base64,${(await readFile(u)).toString('base64')}`;

const sheets = [
  ['compare-1440', 1440, [['hashinclu.de/en/automate', ref('automate-1440.png')], ['Readiness check, EN', ver('en-1440.png')], ['Readiness check, AR', ver('ar-1440.png')]]],
  ['compare-390', 390, [['hashinclu.de/en/automate', ref('automate-390.png')], ['Readiness check, EN', ver('en-390.png')], ['Readiness check, AR', ver('ar-390.png')]]],
];

const browser = await chromium.launch();
for (const [name, w, cols] of sheets) {
  const scale = w === 1440 ? 0.5 : 1;
  const cells = await Promise.all(cols.map(async ([label, u]) =>
    `<figure><figcaption>${label}</figcaption><img src="${await img(u)}" width="${w * scale}"></figure>`));
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#161616;font:13px/1.4 "IBM Plex Mono",monospace;color:#c6c6c6;display:flex;gap:24px;align-items:flex-start}
    figure{margin:0}figcaption{margin-bottom:8px;text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:#78a9ff}
    img{display:block;border:1px solid #393939}</style>${cells.join('')}`;
  const file = ver(`${name}.html`);
  await writeFile(file, html);
  const page = await browser.newPage({ viewport: { width: 100, height: 100 } });
  await page.goto(file.href);
  const size = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: size.w, height: size.h });
  await page.screenshot({ path: fileURLToPath(ver(`${name}.png`)) });
  await page.close();
}
await browser.close();
console.log('comparison sheets written to verification/');
