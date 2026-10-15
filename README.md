# Agentic AI Readiness Check: a concept for Hashinclude

A bilingual (English and Arabic) self-assessment built on the seven questions from Hashinclude's
Insight 09, *"Dubai's Agentic AI mandate: a builder's view"*. A business owner answers in about three minutes
and gets a readiness score, the gaps to close, the right first workflow, the matching delivery tier with
Hashinclude's published timeline and AED range, and an ROI and payback estimate. Hashinclude's team gets a
pre-qualified lead summary (priority A/B/C) that becomes the agenda for the free 30-minute process audit.

> **Concept prototype by Mohammed Imad Thotan for Hashinclude. Not an official Hashinclude product.**
> Pages are `noindex`, nothing is stored or sent anywhere, and no real phone, WhatsApp or booking endpoint is connected.

| | |
|---|---|
| English | `/en/readiness/` |
| Arabic | `/ar/readiness/` (also `/en/readiness/#ar`) |
| Builder's note | append `#note` to either URL |
| Entry `/` | redirects to the last language used (localStorage), else English |

## Run it

Requires Node 20+.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run build` writes a fully static site to `dist/`. Deploy that folder to Netlify or Vercel as is.
`public/_headers` (Netlify) and `vercel.json` add an `X-Robots-Tag: noindex` header, and `robots.txt` disallows crawling.

| Script | What it does |
|---|---|
| `npm test` | Vitest: scoring logic, plus a parity check that every string matches the reference build |
| `npm run verify` | After a build: serves `dist/`, screenshots EN/AR at 360–1440px, asserts the worked example and every interaction, then builds the comparison sheets (Playwright, see below) |
| `npm run lighthouse` | Lighthouse for EN/AR, mobile and desktop. Run `npm run preview -- --port 4330` in another terminal first |
| `npm run design:extract` | Re-runs the design-token extraction from hashinclu.de into `design-reference/` |

Playwright needs a browser once: `npx playwright install chromium`.

## How the scoring works

All logic is in [`src/lib/scoring.ts`](src/lib/scoring.ts): pure functions with no DOM access, unit-tested in [`src/lib/scoring.test.ts`](src/lib/scoring.test.ts).

**Readiness score.** Each of the seven questions scores 0–3. `score = round(sum ÷ 21 × 100)`, computed only once all seven are answered.
Bands: 0–39 *Map before you build*, 40–69 *Ready for a scoped pilot*, 70–100 *Ready to build*.

**Delivery tier.** Start at Compact and take the highest tier that any input triggers. Each trigger adds a visible reason.

| Condition | Minimum tier |
|---|---|
| 2–3 systems, 2–3 workflows, or 201–1,000 people | Standard |
| 4+ systems, 4+ workflows, or 1,000+ people | Platform |
| Government or regulated sector, or data on-premise / air-gapped | Sovereign |

**ROI** (formula shown on the page under part 3):

```
annual hours   = people × weekly hours × 48
hours returned = annual hours × share the agent can take
value / year   = hours returned × cost per hour        (rounded to the nearest AED 100)
roles freed    = hours returned ÷ 1,920
payback months = tier investment (low, high) ÷ monthly value   ("from N" when the range is open-ended)
```

A payback beyond 36 months shows a warning. Inputs are clamped to the form bounds (people 1–1,000, hours 1–60, AED 10–2,000, share 10–80%).
Payback uses the unrounded monthly value, as the reference build does; the difference from the rounded figure is under one month in every realistic case.

**Gaps.** Every question scoring 0 or 1, lowest first, each with a specific fix. The data-residency fix cites the UAE PDPL (Federal Decree-Law No. 45 of 2021).

**Lead priority.** A for 70+ (scope a build), B for 40–69 (process audit, then a pilot proposal), C below 40 (audit and workflow mapping).

**Worked example** (loaded by default): a 40-person Dubai logistics company, 1 workflow, 1 system, answers 2/1/2/1/cloud/1/1,
document processing, 4 people × 15 h × AED 70 at 50%. Result: **52**, *Ready for a scoped pilot*, **Compact**,
**1,440 h**, **AED 100,800**, **0.8** roles, payback **7–11** months, priority **B**, gaps Q2, Q4, Q6, Q7. This is asserted both in the unit tests and on the rendered page.

## Where every figure comes from

| Figure | Source |
|---|---|
| The seven questions and "why it matters" lines | Insight 09, paraphrased |
| Tier names, descriptions, timelines, AED ranges; "below the Compact floor is consulting" | Insight 09, verbatim ranges (checked against the live page on 15 Oct 2026) |
| 127 API endpoints, ~3 weeks to v1 (insurance quoting engine) | Insight 09 and the home page case study |
| NAPCO National: 40% supervisory efficiency, 25% sales lift, 6 months | /automate proof cards |
| 100% referral, free 30-minute process audit | /automate |
| Default "share of work" per workflow (35–60%) | Labelled on the page as a starting assumption; the user moves the slider |
| 48 working weeks, 1,920 hours per FTE | Stated assumptions, shown under the form |
| Scores, values, payback | The formulas above, shown on the page |

## Project layout

```
src/
  content/data.ts        questions, options, workflows, tiers, phases (EN + AR)
  content/i18n.ts        every interface string (EN + AR)
  lib/scoring.ts         score, band, tier, ROI, gaps, priority, lead summary
  lib/render.ts          HTML renderers shared by the build and the client
  scripts/readiness.ts   the single client island (vanilla TS)
  components/            SiteHeader, Hero, Question, WorkflowPicker, ResultPanel, Radar,
                         Brief, BuilderNote, SiteFooter, ReadinessPage
  pages/en|ar/readiness.astro
  styles/global.css      Hashinclude tokens and components (see DESIGN.md)
reference/               the original single-file build (functional and content spec)
design-reference/        hashinclu.de screenshots and extracted tokens
verification/            screenshots, comparison sheets, Lighthouse reports, test and e2e output
```

The page is server-rendered with the worked example, so it is complete without JavaScript. The island
(about 20 KB gzipped) re-renders the live regions with the same `render.ts` functions the build uses, so server
and client markup cannot drift.

## Verification (15 October 2026)

- **Unit tests:** 29/29 pass ([`verification/test-output.txt`](verification/test-output.txt)), including every case required by the brief.
- **End-to-end:** 59/59 checks pass ([`verification/e2e-output.txt`](verification/e2e-output.txt)): no horizontal scroll at 360, 390, 768, 1280 and 1440px in both languages; no console errors; worked-example figures on the page; clear/example; live updates; workflow default share; HTML escaping; language switch keeps the answers; `#ar`; remembered language; `#note`, Esc, backdrop click, focus trap; skip link; arrow-key answers; booking note; mobile result bar.
- **Lighthouse** ([`verification/lighthouse/`](verification/lighthouse/summary.txt)):

  | Page | Performance | Accessibility | Best practices |
  |---|---|---|---|
  | EN mobile | 99 | 100 | 100 |
  | EN desktop | 99 | 100 | 100 |
  | AR mobile | 96 | 100 | 100 |
  | AR desktop | 99 | 100 | 100 |

  SEO reads 60 only because the pages are deliberately `noindex`. Performance varied between runs on the build machine (across the last three runs: lowest single result 88, all others 91–99).
  Profiling showed a fixed ~1.2 s first-layout cost under 4× CPU throttling that appears even with an empty page, so it comes from that machine's Chromium, not this page.
  Re-check on PageSpeed Insights once deployed.
- **Side by side with hashinclu.de:** [`verification/compare-1440.png`](verification/compare-1440.png) and [`verification/compare-390.png`](verification/compare-390.png).

## Decisions and deviations (noted per the brief)

- **Not dark-only.** The brief described the site as dark-first. Measurement showed dark nav, hero, terminals and footer, but **light** content sections, and a blue CTA band. The page follows that real rhythm. Details in [DESIGN.md](DESIGN.md).
- **Arabic face: Cairo**, not IBM Plex Sans Arabic, because hashinclu.de already declares Cairo as its Arabic font. Latin words and digits inside Arabic text stay in IBM Plex.
- **No live Arabic page to match.** hashinclu.de's `/ar/` routes currently serve the English LTR page, so the RTL layout is extrapolated from the LTR system.
- **Fonts are self-hosted** (Fontsource, `font-display: swap`) instead of Google Fonts: same families and weights, no third-party request.
- **Disclosure wording.** The top bar uses the brief's English wording; the Arabic keeps the reference translation. Everything else is verbatim from the reference build, enforced by `src/content/content.test.ts`.
- **New or reworded strings** (your profile line `me_line`, `skip`, split headline, `start`, nav labels, `term_note`, `formula`, footer labels, `foot_noindex`) are listed in `NEW_STRINGS` in `src/content/i18n.ts`. **Their Arabic still needs the planned native-speaker review.**
- **Nav.** Hashinclude's nav collapses to a hamburger on small screens. Here the site links are hidden below 1100px instead, since they are secondary to the tool; the language switch stays visible, and the builder's note is reachable from the hero and the blue band.
- **Contrast.** Two Hashinclude styles fail WCAG AA (light-grey source labels on white; Carbon's yellow-60 text). This build darkens them (`#6f6f6f`, `#7a5b00`).
- **No logos or photography.** The wordmark is text in IBM Plex Sans.
- **Wording to confirm.** The builder's note says *"Researched and built in a day"*; the project brief plans three days. Adjust `built_with` in `i18n.ts` if needed.

## Not in scope

Real booking or CRM integration, user accounts, storing submitted data, Hashinclude logos or images.
