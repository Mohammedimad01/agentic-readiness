// Close-up screenshots of each section (for visual review). Usage: node scripts/shots.mjs [en|ar] [width]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const OUT = fileURLToPath(new URL('../verification/sections/', import.meta.url));
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  let f = join(ROOT, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''));
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); }
  catch { res.writeHead(404); res.end(); }
}).listen(4320);
await mkdir(OUT, { recursive: true });
const [lang = 'en', w = '1440'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto(`http://localhost:4320/${lang}/readiness/`, { waitUntil: 'networkidle' });
await p.evaluate(() => { document.querySelector('.proto-bar').style.position = 'static'; document.querySelector('.nav').style.position = 'static'; document.querySelector('.panel').style.position = 'static'; });
const shots = { nav: '.nav', notice: '#notice', part1: '.part:nth-of-type(1)', q1: '#card-q1', q2: '#card-q2', part3: '.part:nth-of-type(3)', panel: '#result', briefTop: '.brief-grid > .card:nth-child(1)', wf: '.brief-grid > .card:nth-child(2)', phases: '.card--wide', handoff: '.brief-grid > .card:nth-child(4)', ladder: '.brief-grid > .card:nth-child(5)', band: '.band-cta', footer: '.footer' };
for (const [k, sel] of Object.entries(shots)) { const el = p.locator(sel).first(); if (await el.count()) await el.screenshot({ path: join(OUT, `${lang}-${w}-${k}.png`) }); }
await b.close(); server.close();
