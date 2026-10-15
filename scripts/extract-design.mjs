// Design-token extraction from hashinclu.de.
// Visits the reference pages in headless Chromium, records computed styles,
// CSS custom properties and loaded fonts, and saves reference screenshots.
// Usage: node scripts/extract-design.mjs   (writes design-reference/)
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = 'https://hashinclu.de';
const PAGES = [
  ['home', '/en/'],
  ['automate', '/en/automate'],
  ['insight-09', '/en/insights/dubai-agentic-ai-2026'],
  ['scarlett', '/en/scarlett'],
  ['who-we-are', '/en/who-we-are'],
  ['projects', '/en/projects'],
];
const OUT = new URL('../design-reference/', import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const report = {};

for (const [name, path] of PAGES) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 844 }, deviceScaleFactor: 1 });
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      console.warn(`${name}@${width}: ${e.message}`);
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: fileURLToPath(new URL(`${name}-${width}.png`, OUT)), fullPage: false });
    if (width === 1440) {
      await page.screenshot({ path: fileURLToPath(new URL(`${name}-${width}-full.png`, OUT)), fullPage: true });
      report[name] = await page.evaluate(extract);
    }
    await page.close();
  }
  console.log('done', name);
}
await writeFile(new URL('tokens.json', OUT), JSON.stringify(report, null, 2));
await browser.close();

// Runs in the page.
function extract() {
  const pick = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 120),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
      font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, style: s.fontStyle,
      lh: s.lineHeight, ls: s.letterSpacing, tt: s.textTransform,
      color: s.color, bg: s.backgroundColor, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      radius: s.borderRadius, pad: s.padding, margin: s.margin, transition: s.transition,
      w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left),
    };
  };
  const all = (sel, n = 6) => [...document.querySelectorAll(sel)].slice(0, n).map(pick);

  // CSS custom properties declared on :root / html
  const vars = {};
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => {
      for (const rule of list) {
        if (rule.cssRules && !rule.selectorText) walk(rule.cssRules);
        if (rule.selectorText && /(^|,)\s*(:root|html)(\[[^\]]+\])?\s*($|,)/.test(rule.selectorText)) {
          for (const p of rule.style) if (p.startsWith('--')) vars[`${rule.selectorText} ${p}`] = rule.style.getPropertyValue(p).trim();
        }
      }
    };
    walk(rules);
  }

  // Colour frequency across visible elements
  const freq = (prop) => {
    const m = {};
    for (const el of document.querySelectorAll('body *')) {
      const v = getComputedStyle(el)[prop];
      if (!v || v === 'rgba(0, 0, 0, 0)') continue;
      m[v] = (m[v] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 14);
  };

  // Media queries in use
  const mqs = new Set();
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) if (rule.media) mqs.add(rule.media.mediaText);
  }

  const fonts = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`);
  const fontFiles = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\.(woff2?|ttf|otf)(\?|$)/.test(n));
  const sheets = [...document.styleSheets].map((s) => s.href).filter(Boolean);
  const meta = {
    theme: document.querySelector('meta[name="theme-color"]')?.content,
    scheme: document.querySelector('meta[name="color-scheme"]')?.content,
    generator: document.querySelector('meta[name="generator"]')?.content,
    htmlClass: document.documentElement.className,
    htmlAttrs: [...document.documentElement.attributes].map((a) => `${a.name}=${a.value}`),
  };

  // Widest content container
  const containers = [...document.querySelectorAll('main *, header *, section *')]
    .map((el) => ({ el, s: getComputedStyle(el) }))
    .filter(({ s }) => s.maxWidth !== 'none' && s.maxWidth.endsWith('px'))
    .slice(0, 12)
    .map(({ el, s }) => ({ cls: String(el.className).slice(0, 80), maxWidth: s.maxWidth, pad: s.padding, margin: s.margin }));

  return {
    meta, fonts, fontFiles, sheets, vars, mqs: [...mqs],
    body: pick(document.body), html: pick(document.documentElement),
    h1: all('h1', 3), h2: all('h2', 5), h3: all('h3', 5), h4: all('h4', 3), p: all('main p, p', 6),
    em: all('h1 em, h1 i, h2 em, h2 i, h1 strong, h1 b, h2 strong', 6),
    a: all('main a, a', 10), buttons: all('button, a[class*="btn"], a[class*="button"], [class*="cta"]', 10),
    nav: all('header, nav', 3), navLinks: all('header a, nav a', 10),
    footer: all('footer', 1), footerLinks: all('footer a', 8), footerText: all('footer p, footer span', 8),
    mono: [...document.querySelectorAll('body *')].filter((el) => /mono|courier|consol/i.test(getComputedStyle(el).fontFamily) && el.children.length === 0 && el.textContent.trim()).slice(0, 14).map(pick),
    inputs: all('input, textarea, select', 6),
    sections: all('main > section, main > div, section', 8),
    cards: all('[class*="card"], article, li[class]', 8),
    containers,
    colors: freq('color'), bgs: freq('backgroundColor'), borders: freq('borderTopColor'),
  };
}
