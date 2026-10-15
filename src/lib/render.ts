// HTML-string renderers for every region that changes with the answers.
// Used twice: by the Astro components at build time (initial worked example, no JS needed)
// and by the client island on every input, so server and client markup can never drift.
import { QUESTIONS, TIERS, PHASES, GAPFIX, type Lang } from '../content/data';
import { t, type StringKey } from '../content/i18n';
import {
  fmt, fmt1, money, paybackText, priorityKey, workflowById, PAYBACK_WARN_MONTHS,
  type Result, type State, type Band,
} from './scoring';

export const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Splits a heading at its last comma so the tail can be set in the bold emphasis style. */
export function emphasise(text: string): string {
  const i = Math.max(text.lastIndexOf(', '), text.lastIndexOf('، '));
  if (i < 0) return esc(text);
  return `${esc(text.slice(0, i + 1))} <strong>${esc(text.slice(i + 2))}</strong>`;
}

export const bandClass = (b: Band | null) => (b === 'low' ? 'crit' : b === 'mid' ? 'warn' : b === 'high' ? 'good' : 'none');
const bandLabel = (r: Result, lang: Lang) => (r.band ? t(lang, `band_${r.band}` as StringKey) : t(lang, 'incomplete'));
const scoreText = (r: Result) => (r.score == null ? '—' : String(r.score));

/* ---------- radar ---------- */

export function radarSVG(scores: (number | null)[], lang: Lang): string {
  const N = 7, R = 80;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  const f = (p: [number, number]) => p.map((v) => v.toFixed(1)).join(',');
  let s = '';
  for (let k = 1; k <= 3; k++) {
    s += `<polygon class="r-grid" points="${Array.from({ length: N }, (_, i) => f(pt(i, (R * k) / 3))).join(' ')}"/>`;
  }
  for (let i = 0; i < N; i++) {
    const [x, y] = pt(i, R);
    s += `<line class="r-axis" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  }
  const dp = scores.map((v, i) => pt(i, (R * (v ?? 0)) / 3));
  if (scores.some((v) => v != null)) s += `<polygon class="r-data" points="${dp.map(f).join(' ')}"/>`;
  scores.forEach((v, i) => {
    if (v != null) s += `<rect class="r-dot" x="${(dp[i][0] - 3).toFixed(1)}" y="${(dp[i][1] - 3).toFixed(1)}" width="6" height="6"/>`;
  });
  QUESTIONS.forEach((q, i) => {
    const [x, y] = pt(i, R + 14);
    const anchor = Math.abs(x) < 8 ? 'middle' : x > 0 ? 'start' : 'end';
    const dy = y < -R * 0.6 ? -2 : y > R * 0.6 ? 10 : 4;
    const low = scores[i] != null && scores[i]! <= 1;
    s += `<text class="r-label${low ? ' low' : ''}" x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${esc(q.axis[lang])}</text>`;
  });
  const desc = QUESTIONS.map((q, i) => `${q.axis[lang]} ${scores[i] ?? '—'}/3`).join(', ');
  return `<svg viewBox="-170 -112 340 224" role="img" aria-label="${esc(t(lang, 'radar_aria'))}: ${esc(desc)}">${s}</svg>`;
}

/* ---------- result panel ---------- */

export function panelHead(r: Result, lang: Lang): string {
  return `<span class="tag">${esc(t(lang, 'readiness'))}</span><span class="tag tag--muted">${esc(t(lang, 'answered_n').replace('{n}', String(r.answered)))}</span>`;
}

export function scoreBlock(r: Result, lang: Lang): string {
  const C = 2 * Math.PI * 52;
  const frac = r.score == null ? 0 : r.score / 100;
  const cls = bandClass(r.band);
  const desc = r.band ? t(lang, `band_${r.band}_d` as StringKey) : t(lang, 'incomplete_d').replace('{n}', String(7 - r.answered));
  return `
    <svg class="ring ring--${cls}" viewBox="0 0 120 120" role="img" aria-label="${esc(t(lang, 'readiness'))}: ${scoreText(r)} / 100">
      <circle cx="60" cy="60" r="52" class="ring-bg"/>
      <circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"${frac > 0 ? '' : ' visibility="hidden"'}/>
      <text x="60" y="57" class="ring-num" text-anchor="middle" dominant-baseline="central">${scoreText(r)}</text>
      <text x="60" y="86" class="ring-sub" text-anchor="middle">/ 100</text>
    </svg>
    <div class="score-text">
      <span class="key">readiness_score</span>
      <span class="band band--${cls}">${esc(bandLabel(r, lang))}</span>
      <p>${esc(desc)}</p>
    </div>`;
}

export function tierBlock(r: Result, lang: Lang): string {
  return `
    <span class="key">delivery_tier</span>
    <p class="tier-name">${esc(r.tier.name[lang])}</p>
    <dl class="tier-meta">
      <div><dt>${esc(t(lang, 'timeline'))}</dt><dd>${esc(r.tier.time[lang])}</dd></div>
      <div><dt>${esc(t(lang, 'investment'))}</dt><dd>${esc(r.tier.inv[lang])}</dd></div>
    </dl>
    <ul class="reasons">${r.reasons.map((k) => `<li>${esc(t(lang, k))}</li>`).join('')}</ul>`;
}

export function roiBlock(r: Result, lang: Lang): string {
  const roi = r.roi;
  if (!roi) return `<p class="muted roi-missing">${esc(t(lang, 'roi_missing'))}</p>`;
  const stat = (key: string, label: StringKey, value: string) =>
    `<div class="stat"><span class="key">${key}</span><b>${esc(value)}</b><span class="stat-label">${esc(t(lang, label))}</span></div>`;
  const warn = roi.pbLo > PAYBACK_WARN_MONTHS ? `<p class="warnbox">${esc(t(lang, 'pb_warn'))}</p>` : '';
  return `<div class="stats">
      ${stat('hours_returned', 'roi_hours', fmt(roi.freed))}
      ${stat('annual_value_aed', 'roi_value', fmt(roi.value))}
      ${stat('fte_freed', 'roi_fte', fmt1(roi.fte))}
      ${stat('payback_months', 'roi_pb', paybackText(roi, lang))}
    </div>${warn}`;
}

/* ---------- hero terminal ---------- */

export function terminalRows(r: Result, lang: Lang): string {
  const cls = bandClass(r.band);
  const [prio, prioNote] = r.priority ? t(lang, priorityKey(r.priority)).split(' · ') : ['—', ''];
  const row = (k: string, v: string, mod = '', small = '') =>
    `<div class="term-row"><span class="term-k">${k}</span><span class="term-v ${mod}" dir="auto">${esc(v)}${small ? ` <small>${esc(small)}</small>` : ''}</span></div>`;
  return [
    row('readiness_score', r.score == null ? '—' : `${r.score}`, `term-v--${cls}`, '/100'),
    row('delivery_tier', r.tier.name[lang], 'term-v--white', r.tier.time[lang]),
    row('investment', r.tier.inv[lang], 'term-v--blue term-v--sm'),
    row('hours_returned', r.roi ? fmt(r.roi.freed) : '—', 'term-v--blue', r.roi ? t(lang, 'h_hours') : ''),
    row('annual_value', r.roi ? money(r.roi.value, lang) : '—', 'term-v--green'),
    row('payback_months', paybackText(r.roi, lang), 'term-v--white'),
    row('lead_priority', prio, 'term-v--white', prioNote),
  ].join('');
}

/* ---------- brief ---------- */

export function briefEyebrow(state: State, lang: Lang): string {
  const c = state.company.trim();
  return `${esc(t(lang, 'brief_eyebrow'))}${c ? ` <span aria-hidden="true">/</span> <span dir="auto">${esc(c)}</span>` : ''}`;
}

export function gapsBlock(r: Result, lang: Lang): string {
  if (!r.gaps.length) return `<p class="muted">${esc(t(lang, r.answered === 7 ? 'no_gaps' : 'gaps_pending'))}</p>`;
  return `<ol class="gaps">${r.gaps.map((g) => `
    <li><span class="chip chip--${g.s === 0 ? 'crit' : 'warn'}" dir="ltr">${g.s}/3</span>
      <div><strong>${esc(g.q.short[lang])}</strong><p>${esc(GAPFIX[g.q.id][lang])}</p></div></li>`).join('')}</ol>`;
}

export function workflowBlock(state: State, r: Result, lang: Lang): string {
  const wf = workflowById(state.workflow);
  if (!wf) return `<p class="muted">${esc(t(lang, 'wf_pending'))}</p>`;
  const mini = r.roi
    ? `<p class="mini"><span>${esc(t(lang, 'roi_hours'))}: <b>${fmt(r.roi.freed)}</b></span><span>${esc(t(lang, 'roi_value'))}: <b>${fmt(r.roi.value)}</b></span></p>`
    : '';
  return `<div class="wf-head"><span class="icon-tag" aria-hidden="true">${wf.tag}</span><p class="wf-name">${esc(wf.name[lang])}</p></div>
    <p>${esc(wf.desc[lang])}</p>${mini}
    <div class="proof"><span class="tag">${esc(t(lang, 'proof_h'))}</span><p>${esc(wf.proof[lang])}</p></div>`;
}

export function phasesMeta(r: Result, lang: Lang): string {
  return `${esc(r.tier.name[lang])} · ${esc(r.tier.time[lang])}`;
}

export function phasesBlock(r: Result, lang: Lang): string {
  const unit = t(lang, r.tier.id === 'compact' ? 'week' : 'phase');
  return PHASES.map((p, i) => `
    <li class="step">
      <span class="step-num" dir="ltr">${String(i + 1).padStart(2, '0')}</span>
      <h4>${esc(p.t[lang])}</h4>
      <p>${esc(p.d[lang])}</p>
      <span class="step-tag">${esc(unit)} ${i + 1}</span>
    </li>`).join('');
}

export function ladderRows(r: Result, lang: Lang): string {
  return TIERS.map((tr) => {
    const rec = tr.id === r.tier.id;
    return `<tr${rec ? ' class="rec"' : ''}>
      <th scope="row">${esc(tr.name[lang])}${rec ? `<span class="step-tag">${esc(t(lang, 'recommended'))}</span>` : ''}</th>
      <td>${esc(tr.desc[lang])}</td><td class="num">${esc(tr.time[lang])}</td><td class="num">${esc(tr.inv[lang])}</td></tr>`;
  }).join('');
}

/* ---------- small bits ---------- */

export function mobileBar(r: Result, lang: Lang): string {
  return `<span class="mbar-score" dir="ltr"><b>${scoreText(r)}</b><small>/100</small></span>
    <span class="mbar-meta"><span>${esc(bandLabel(r, lang))}</span><span>${esc(r.tier.name[lang])}</span></span>`;
}

export function liveSummary(r: Result, lang: Lang): string {
  return `${t(lang, 'readiness')}: ${scoreText(r)} / 100. ${bandLabel(r, lang)}. ${t(lang, 'scope')}: ${r.tier.name[lang]}.`;
}

export function shareHint(state: State, lang: Lang): string {
  const wf = workflowById(state.workflow);
  return wf ? t(lang, 'share_hint').replace('{w}', wf.name[lang]) : t(lang, 'share_hint_none');
}
