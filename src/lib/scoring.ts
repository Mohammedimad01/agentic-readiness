// Pure scoring logic: readiness score, band, delivery tier, ROI, gaps, lead priority
// and the plain-text lead summary. No DOM access; unit-tested in scoring.test.ts.
import {
  QUESTIONS, TIERS, WORKFLOWS, SECTORS, SIZES, SYSTEMS, WFCOUNT,
  type Lang, type QuestionId, type Tier, type Question, type Choice,
} from '../content/data';
import { t, type StringKey } from '../content/i18n';

export interface State {
  company: string;
  sector: string;
  size: string;
  wfCount: string;
  systems: string;
  q: Partial<Record<QuestionId, string>>;
  workflow: string | null;
  people: number | null;
  hours: number | null;
  rate: number | null;
  /** Percentage of the work the agent can take, 10–80 in steps of 5. */
  share: number;
  /** True once the user has moved the slider, so picking a workflow no longer resets it. */
  shareTouched: boolean;
}

export type Band = 'low' | 'mid' | 'high';
export type Priority = 'A' | 'B' | 'C';

export interface ROI {
  annual: number;
  freed: number;
  value: number;
  fte: number;
  pbLo: number;
  pbHi: number | null;
}

export interface Gap { q: Question; s: number }

export interface Result {
  scores: (number | null)[];
  answered: number;
  score: number | null;
  band: Band | null;
  tier: Tier;
  reasons: StringKey[];
  roi: ROI | null;
  gaps: Gap[];
  priority: Priority | null;
}

/** Working weeks in a year, and hours in one full-time role. */
export const WEEKS_PER_YEAR = 48;
export const FTE_HOURS = 1920;
/** Payback beyond this many months triggers the "hard to justify" warning. */
export const PAYBACK_WARN_MONTHS = 36;

/** Input bounds, mirrored on the form controls. Values outside are clamped. */
export const BOUNDS = {
  people: { min: 1, max: 1000, step: 1 },
  hours: { min: 1, max: 60, step: 1 },
  rate: { min: 10, max: 2000, step: 5 },
  share: { min: 10, max: 80, step: 5 },
} as const;

export function exampleState(): State {
  return {
    company: '', sector: 'logistics', size: 's21', wfCount: '1', systems: '1',
    q: { q1: 'c', q2: 'b', q3: 'c', q4: 'b', q5: 'cloud', q6: 'b', q7: 'b' },
    workflow: 'docs', people: 4, hours: 15, rate: 70, share: 50, shareTouched: false,
  };
}

export function blankState(): State {
  return {
    company: '', sector: '', size: '', wfCount: '', systems: '', q: {}, workflow: null,
    people: null, hours: null, rate: null, share: 40, shareTouched: false,
  };
}

/** Score (0–3) for each of the seven questions, or null when unanswered. */
export function questionScores(answers: State['q']): (number | null)[] {
  return QUESTIONS.map((q) => q.opts.find((o) => o.id === answers[q.id])?.s ?? null);
}

/** round(sum / 21 × 100), only once all seven questions are answered. */
export function readinessScore(scores: (number | null)[]): number | null {
  if (scores.length !== QUESTIONS.length || scores.some((s) => s == null)) return null;
  const total = scores.reduce<number>((a, s) => a + (s ?? 0), 0);
  return Math.round((total / (QUESTIONS.length * 3)) * 100);
}

export function bandFor(score: number | null): Band | null {
  if (score == null) return null;
  if (score < 40) return 'low';
  if (score < 70) return 'mid';
  return 'high';
}

/** Start at Compact and take the highest tier any input triggers, collecting a reason for each. */
export function computeTier(state: State): { tier: Tier; reasons: StringKey[] } {
  let level = 0;
  const reasons: StringKey[] = [];
  const bump = (l: number, key: StringKey) => { if (l > level) level = l; reasons.push(key); };
  if (state.systems === '2-3') bump(1, 'r_sys23');
  if (state.systems === '4-6' || state.systems === '7+') bump(2, 'r_sys4');
  if (state.wfCount === '2-3') bump(1, 'r_wf23');
  if (state.wfCount === '4+') bump(2, 'r_wf4');
  if (state.size === 's201') bump(1, 'r_size201');
  if (state.size === 's1000') bump(2, 'r_size1000');
  if (state.sector === 'gov') bump(3, 'r_gov');
  if (state.q.q5 === 'airgap') bump(3, 'r_airgap');
  const missing = !state.systems || !state.wfCount || !state.size;
  if (!reasons.length && !missing) reasons.push('r_compact');
  if (missing) reasons.push('r_pending');
  return { tier: TIERS[level], reasons };
}

const clamp = (v: number, b: { min: number; max: number }) => Math.min(b.max, Math.max(b.min, v));
const usable = (v: number | null): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * annual = people × hours × 48; freed = annual × share; value = freed × rate (to the nearest AED 100);
 * fte = freed / 1,920; payback = tier investment ÷ monthly value, at the low and high end of the range.
 */
export function computeROI(state: State, tier: Tier): ROI | null {
  const { people, hours, rate, share } = state;
  if (!usable(people) || !usable(hours) || !usable(rate) || !usable(share)) return null;
  const p = clamp(people, BOUNDS.people);
  const h = clamp(hours, BOUNDS.hours);
  const r = clamp(rate, BOUNDS.rate);
  const sh = clamp(share, BOUNDS.share);
  const annual = p * h * WEEKS_PER_YEAR;
  const freed = (annual * sh) / 100;
  const exactValue = freed * r;
  const value = Math.round(exactValue / 100) * 100;
  const perMonth = exactValue / 12;
  const pbLo = Math.max(1, Math.round(tier.lo / perMonth));
  const pbHi = tier.hi == null ? null : Math.max(1, Math.round(tier.hi / perMonth));
  return { annual, freed: Math.round(freed), value, fte: freed / FTE_HOURS, pbLo, pbHi };
}

/** Every answered question scoring 0 or 1, lowest first (stable for ties). */
export function computeGaps(scores: (number | null)[]): Gap[] {
  return QUESTIONS.map((q, i) => ({ q, s: scores[i] }))
    .filter((g): g is Gap => g.s != null && g.s <= 1)
    .sort((a, b) => a.s - b.s);
}

export function leadPriority(score: number | null): Priority | null {
  if (score == null) return null;
  if (score >= 70) return 'A';
  if (score >= 40) return 'B';
  return 'C';
}

export function compute(state: State): Result {
  const scores = questionScores(state.q);
  const answered = scores.filter((s) => s != null).length;
  const score = readinessScore(scores);
  const band = bandFor(score);
  const { tier, reasons } = computeTier(state);
  const roi = computeROI(state, tier);
  const gaps = computeGaps(scores);
  return { scores, answered, score, band, tier, reasons, roi, gaps, priority: leadPriority(score) };
}

/* ---------- formatting ---------- */

/** Western digits with comma grouping in both languages. */
export const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
export const fmt1 = (n: number) => n.toFixed(1);
export const money = (n: number, lang: Lang) => (lang === 'ar' ? `${fmt(n)} درهم` : `AED ${fmt(n)}`);

/** "7–11", "from 23", or the Arabic "من 7 إلى 11" (worded, so bidi cannot reorder the range). */
export function paybackText(roi: ROI | null, lang: Lang): string {
  if (!roi) return '—';
  if (roi.pbHi == null) return `${t(lang, 'from')} ${roi.pbLo}`;
  if (roi.pbLo === roi.pbHi) return `${roi.pbLo}`;
  return lang === 'ar' ? `من ${roi.pbLo} إلى ${roi.pbHi}` : `${roi.pbLo}–${roi.pbHi}`;
}

export const priorityKey = (p: Priority | null): StringKey =>
  p === 'A' ? 'pr_a' : p === 'B' ? 'pr_b' : p === 'C' ? 'pr_c' : 'pr_pending';

const findChoice = (list: Choice[], id: string) => list.find((x) => x.id === id) ?? null;
export const workflowById = (id: string | null) => WORKFLOWS.find((w) => w.id === id) ?? null;

/** The plain-text lead summary Hashinclude's team would receive. */
export function handoffText(state: State, r: Result, lang: Lang): string {
  const T = (k: StringKey) => t(lang, k);
  const none = T('not_given');
  const line = (k: StringKey, v: string) => `${T(k)}: ${v}`;
  const wf = workflowById(state.workflow);
  const sec = findChoice(SECTORS, state.sector);
  const size = findChoice(SIZES, state.size);
  const sys = findChoice(SYSTEMS, state.systems);
  const wfc = findChoice(WFCOUNT, state.wfCount);
  const q5 = QUESTIONS[4].opts.find((o) => o.id === state.q.q5);
  const next = r.band === 'high'
    ? T('next_high').replace('{t}', r.tier.name[lang])
    : r.band === 'mid' ? T('next_mid') : T('next_low');
  return [
    T('h_title'), '',
    line('h_company', state.company.trim() || none),
    line('h_sector', sec ? sec[lang] : none),
    line('h_team', size ? size[lang] : none),
    line('h_ready', r.score == null ? T('h_incomplete').replace('{n}', String(r.answered)) : `${r.score}/100 · ${T(`band_${r.band!}` as StringKey)}`),
    line('h_wf', wf ? wf.name[lang] : none),
    line('h_systems', sys ? sys[lang] : none),
    line('h_wfcount', wfc ? wfc[lang] : none),
    line('h_data', q5 ? q5[lang] : none),
    line('h_gaps', r.gaps.length ? r.gaps.map((g) => g.q.short[lang]).join(T('sep')) : T('h_nogaps')),
    line('h_scope', `${r.tier.name[lang]} · ${r.tier.time[lang]} · ${r.tier.inv[lang]}`),
    line('h_value', r.roi ? `${fmt(r.roi.freed)} ${T('h_hours')} ≈ ${money(r.roi.value, lang)}` : none),
    line('h_priority', T(priorityKey(r.priority))),
    line('h_next', next),
  ].join('\n');
}
