# DESIGN.md: Hashinclude design language, as applied to the Readiness Check

Extracted on 15 October 2026 from the live site with headless Chromium (`scripts/extract-design.mjs`).
The raw dump is in `design-reference/tokens.json`. Screenshots at 1440px and 390px (plus 1440px full-page) for
home, automate, insight-09, scarlett, who-we-are and projects are in `design-reference/`.

The site runs **Astro v5.18.1** (`<meta name="generator">`) with Tailwind v4 utilities and component-scoped
`v2-*` / `v2a-*` classes. `<html data-theme="corporate">`, root font-size **18px**.

---

## 1. What the brief assumed, and what the site actually does

| Brief assumption | Measured | Decision |
|---|---|---|
| "Dark-first", `theme-color #0d0d0d`, `color-scheme: dark` | Meta tags confirmed. But only the **nav, hero, terminal widgets and footer** are dark. Every content section on /automate and Insight 09 is **light** (`#ffffff`, alternating with `#f4f4f4`), and the closing CTA band is solid blue. | Mirror the real page rhythm: dark nav and hero, light working area, dark footer. There is no light/dark *theme toggle* on the site, so we ship one fixed scheme with every colour set explicitly. |
| Arabic face: "IBM Plex Sans Arabic or Noto Kufi Arabic" | The site already declares `--font-family-arabic: "Cairo", "Noto Sans Arabic"` and loads Cairo 400/600/700 from Google Fonts. | **Cairo**. It is the face Hashinclude already ships for Arabic, so the AR page will match their own AR pages. Its geometric, low-contrast strokes also sit well next to Plex Sans. |
| Large italic statement + bold phrase | Two headline idioms: (a) the **home** hero sets the whole line in *IBM Plex Serif italic* 72px with one word in blue; (b) every **inner page** (/automate, Insight 09) uses Plex Sans **300** with the emphasised phrase in `<strong>` at **600**, coloured `#0043ce` on light sections and white on dark ones. | Use idiom (b), because this tool lives on /automate and under Insight 09. No serif is loaded. |
| A live Arabic page to match | `/ar/automate`, `/ar/who-we-are` and the other `/ar/` routes return 200 but serve the **English, LTR** page (`dir="ltr"`, checked 15 Oct 2026). Only the Cairo declaration hints at the planned RTL design. | The RTL layout is an extrapolation of the LTR system: mirrored with logical properties, Cairo for text, Plex Mono kept for numbers and code tokens. |
| Rounded components | **Every** radius is `0px`: buttons, cards, inputs, tags, terminal, chat button. | Square everything. No pills with rounded ends. |

## 2. Colour

The palette is IBM Carbon's grey and blue ramps (Plex + Carbon are consistent throughout).

| Token | Value | Where it is used on hashinclu.de |
|---|---|---|
| `--c-black` | `#0a0a0a` | Nav bar, hero sections, footer bottom bar |
| `--c-darker` | `#0d0d0d` | `<body>` background, `theme-color` |
| `--c-gray-100` | `#161616` | Primary text on light sections (164 elements on /automate) |
| `--c-gray-90` | `#262626` | Footer background |
| `--c-gray-80` | `#393939` | Body copy on light sections |
| `--c-gray-80-line` | `#333333` | Footer border, terminal border on dark |
| `--c-gray-60` | `#6f6f6f` | Muted labels (stat labels on home) |
| `--c-gray-50` | `#8d8d8d` | Terminal left border |
| `--c-gray-30` | `#c6c6c6` | Body copy on dark, nav links, footer links |
| `--c-gray-20` | `#e0e0e0` | Card and grid borders on light |
| `--c-gray-10` | `#f4f4f4` | Alternate section background, card hover |
| `--c-white` | `#ffffff` | Section background, headings on dark |
| `--c-blue-60` | `#0f62fe` | Primary buttons, nav CTA, CTA band, skip link |
| `--c-blue-70` | `#0043ce` | Hover for blue; emphasised headline words, tags, step numbers and stat numbers on light |
| `--c-blue-40` | `#78a9ff` (site uses `#7aa7ff`) | Blue text on dark |
| `--c-blue-tint` | `rgba(15,98,254,.06)` | Service-icon squares (`RPA`, `AI`, `</>`, `OPS`) |
| `--c-green-50` | `#24a148` | `productivity_gain 30%+`, step tags |
| `--c-green-10` | `#defbe6` | Step-tag background ("No commitment") |
| Terminal surface | `rgba(22,27,34,.8)` with `1px #333` border | `v2a-terminal` |
| Ghost border | `#444444` (dark), `rgba(255,255,255,.5)` (on blue) | `v2-btn-ghost`, `v2-btn-ghost-white` |

**Additions needed by the tool** (the site has no warning or error states), all taken from the same Carbon ramps
so they read as native: `--c-red-60 #da1e28` / `--c-red-10 #fff1f1`, `--c-yellow-text #8e6a00` / `--c-yellow-10 #fcf4d6`,
`--c-green-60 #198038` for text on white (green-50 falls just short of 4.5:1 for small text).

**Contrast deviation.** On /automate, proof-card sources (`RETAIL · KSA`) are set in `#c6c6c6` on white (about 1.7:1).
That fails WCAG AA, so the same style here uses `#6f6f6f` (5.0:1).

## 3. Typography

Loaded on the site from Google Fonts: `IBM Plex Sans 300;400;500;600;700`, `IBM Plex Mono 300;400;500`, `Cairo 400;600;700`, `display=swap`.
This build self-hosts the same families through Fontsource (latin subsets; Cairo arabic subset on `/ar/` only), still `font-display: swap`, which removes the third-party round trip.

| Role | Family | Size / line-height | Weight | Notes |
|---|---|---|---|---|
| H1 (inner hero) | Plex Sans | 50.4 / 60.5px (2.8rem / 1.2); 36 / 43.2px at ≤ 720px | 300, `<strong>` 600 | White on dark |
| H2 (section) | Plex Sans | 39.6 / 51.5px (2.2rem / 1.3); 27px mobile | 300, `<strong>` 600 in `#0043ce` | `#161616` on light |
| H3 / card title | Plex Sans | 15 / 19.5px | 600 | Card and step titles are small and bold, not large |
| H4 / sector title | Plex Sans | 14 / 19.6px | 600 | |
| Hero lede | Plex Sans | 18 / 30.6px (1.7) | 300 | `#c6c6c6`, max-width 480px |
| Section sub | Plex Sans | 15 / 25.5px | 400 | `#393939`, max-width 640px |
| Card body | Plex Sans | 14 / 23.8px (1.7) | 400 | `#393939` |
| Tag / eyebrow (`v2-tag`) | Plex Mono | 11 / 17.6px | 400 | UPPERCASE, `letter-spacing .12em` (1.32px), `#0043ce` |
| Breadcrumb | Plex Mono | 11px | 400 | UPPERCASE, `letter-spacing .15em` (1.65px), blue dot + `/` separators |
| Step number (`01`) | Plex Mono | 12px | 400 | `#0043ce`, `letter-spacing .05em` |
| Stat key (`productivity_gain`) | Plex Mono | 12px | 400 | snake_case, lowercase, `#c6c6c6` on terminal |
| Stat value (terminal) | Plex Mono | 25.2 / 40.3px | 500 | green / blue / white |
| Proof number (`40%`) | Plex Mono | 36 / 57.6px | 500 | `#0043ce` |
| Case-study number (`365K+`) | Plex Mono | 28.8px | 500 | `letter-spacing -.015em` |
| Button | Plex Sans | 14px | 500 (primary), 400 (ghost), 600 (white-on-blue) | Arrow `→` typed into the label |
| Nav link | Plex Sans | 14px | 400 | `#c6c6c6`, 48px tall, 18px side padding |
| Footer column title | Plex Sans | 12px | 600 | UPPERCASE, `letter-spacing .08em`, white |
| Footer link | Plex Sans | 13px | 400 | `#c6c6c6` |

**Arabic** (`dir="rtl"`): Cairo replaces Plex Sans for all text. Headings keep the light/bold contrast (Cairo 300 / 700).
Mono labels switch to Cairo 600 with no letter-spacing or uppercasing, since neither applies to Arabic script.
Numbers, snake_case keys and code-like strings stay in Plex Mono inside `dir="ltr"` spans. Line-height rises to 1.8 for body copy.

## 4. Layout and spacing

- Spacing is built on **9px steps** (0.5rem at an 18px root): 9, 13.5, 18, 22.5, 27, 36, 54, 72 and 90px.
- Page container: `max-width 1504px`, side padding **72px** (content is 1296px at 1440). At ≤ 900px the padding is **36px** (measured at 390px). This build drops to 20px at ≤ 400px so 360px screens keep usable form width.
- Sections: `padding 90px 72px`; at ≤ 900px `54px 36px`. Alternate sections use `#f4f4f4`.
- Hero: two equal columns (720 / 720 at 1440). Left column `padding 90px 54px 90px 72px` holds breadcrumb, H1, lede and two buttons. The right column holds the terminal. Stacks at ≤ 1024px.
- Grids of cards share borders: the grid has a `1px #e0e0e0` border with `gap: 0`, and each card has `padding: 36px`, so the lines read like a spec sheet, not separate floating cards.
- Breakpoints in their CSS: 1100, 1024, 960, 900, 768, 720, 520, 480. This build uses 1024 (hero), 960 (form and panel stack, bottom bar), 900 (gutters), 720 (type), 520 (single-column grids) and 400.
- Nav: fixed, 48px tall, `#0a0a0a`, items separated by 1px vertical lines and the blue CTA block flush right. Below 900px the links collapse to a hamburger.

## 5. Components

| Component | Spec (measured) | Used here for |
|---|---|---|
| Primary button `v2-btn-primary` | `#0f62fe`, white, 14px/500, padding 15.75 × 27px (56px tall), radius 0; hover `#0043ce`; transition `background .15s` | "Start the check →", "Book a free process audit" |
| Ghost button `v2-btn-ghost` | Transparent, `1px #444`, white 14px/400; hover border white, bg `#1a1a1a` | Builder's note (dark hero) |
| Light-section secondary | Not on the site; derived: transparent, `1px #161616`, text `#161616`; hover bg `#f4f4f4` | "Clear all answers", "Copy summary" |
| White on blue `v2-btn-white` | White bg, `#0043ce` text, 600; hover `#f4f4f4` | CTA band |
| Tag `v2-tag` | Mono 11px uppercase blue, margin-bottom 18px | Section eyebrows: `01 / 03 · Your business` |
| Breadcrumb | Mono 11px uppercase blue, 9px gap, leading dot | Hero eyebrow (mandate line) |
| Terminal `v2a-terminal` | Dark translucent surface, 36px padding, three traffic-light dots (`#ff5f57`, `#febc2e`, `#28c840`), key/value rows separated by 1px lines | Hero live readout; lead summary |
| Service icon | 40 × 40, mono 13px `#0043ce` on blue tint | Workflow tiles (`DOC`, `CX`, `LEAD`, `KB`, `BI`, `INV`) |
| Proof card | `1px #e0e0e0`, 36px padding; mono number 36px blue-70, label 13px gray-80, source mono 11px uppercase; hover border `#0f62fe` | ROI stats |
| Process step | White card in a shared-border grid, mono step number, 15px/600 title, 14px body, green step tag (`2–6 weeks typical`) | Delivery phases |
| Step tag | Mono 11px, `#24a148` on `#defbe6`, padding 2 × 8px, square | Score chips, "Your fit" |
| FAQ row | Full-width rows, 22.5px vertical padding, 15px/600 question, 1px dividers | Gaps list |
| Inputs | The only measured field is the dark chat input (`#111`, `1px #2a2a2a`, focus `#555`). For light sections we follow Carbon fields (consistent with Plex and Carbon colours): `#f4f4f4` fill, 1px bottom border `#8d8d8d`, 48px tall, focus 2px `#0f62fe` outline. | Part 1 and Part 3 fields |
| Footer | `#262626`, `border-top 1px #333`, padding 54 × 72px, uppercase 12px column titles, 13px links; bottom bar `#0a0a0a`, 18 × 72px | Footer |

## 6. Motion and arrows

- Transitions are short and functional: `.15s` on colour, background and border (Tailwind default `cubic-bezier(.4,0,.2,1)`). Card hover changes the background to `#f4f4f4` or the border to blue. Nothing bounces or slides.
- The site respects `prefers-reduced-motion: no-preference` for its star-field canvas. This build has no ambient animation, and the ring and bar transitions are disabled under `reduce`.
- Arrows are literal text characters inside labels: `Book Free Process Audit →`, `Scarlett →`, `Read →`, `← All insights`. In RTL they flip to `←`.

## 7. Vernacular carried into the tool

- snake_case mono keys for every headline metric: `readiness_score`, `delivery_tier`, `hours_returned`, `annual_value_aed`, `fte_freed`, `payback_months`, `lead_priority`.
- Three-letter mono service tags on the workflow tiles.
- Counters `01 / 03` on the form parts and `01`–`06` on the phases.
- A console header on the lead summary (`$ cat lead_summary.txt`), echoing the `anas.exe` widget.
- Breadcrumb eyebrow with `/` separators.

## 8. Brand guardrails applied

- No logo files, client logos or photography. The wordmark is text: `#include`, set in Plex Sans with the `#` in blue.
- A slim, always-visible disclosure bar sits above the nav (sticky).
- `<meta name="robots" content="noindex, nofollow">`.
- No phone, WhatsApp or form endpoint. Nav links point to public hashinclu.de pages only. "Book" shows a prototype note.
