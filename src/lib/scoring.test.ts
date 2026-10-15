import { describe, it, expect } from 'vitest';
import {
  compute, exampleState, blankState, handoffText, paybackText, fmt, fmt1,
  computeTier, readinessScore, bandFor, leadPriority, PAYBACK_WARN_MONTHS, type State,
} from './scoring';
import { QUESTIONS } from '../content/data';
import { t } from '../content/i18n';

const allThrees = (): State['q'] => ({ q1: 'd', q2: 'd', q3: 'd', q4: 'd', q5: 'cloud', q6: 'd', q7: 'd' });

describe('worked example: 40-person Dubai logistics company', () => {
  const s = exampleState();
  const r = compute(s);

  it('scores 52 and lands in "Ready for a scoped pilot"', () => {
    expect(r.scores).toEqual([2, 1, 2, 1, 3, 1, 1]);
    expect(r.answered).toBe(7);
    expect(r.score).toBe(52);
    expect(r.band).toBe('mid');
    expect(t('en', 'band_mid')).toBe('Ready for a scoped pilot');
  });

  it('recommends the Compact tier with the Compact reason', () => {
    expect(r.tier.id).toBe('compact');
    expect(r.reasons).toEqual(['r_compact']);
  });

  it('returns 1,440 hours, AED 100,800, 0.8 FTE and a 7–11 month payback', () => {
    expect(r.roi).not.toBeNull();
    expect(r.roi!.annual).toBe(2880);
    expect(r.roi!.freed).toBe(1440);
    expect(fmt(r.roi!.freed)).toBe('1,440');
    expect(r.roi!.value).toBe(100800);
    expect(fmt1(r.roi!.fte)).toBe('0.8');
    expect([r.roi!.pbLo, r.roi!.pbHi]).toEqual([7, 11]);
    expect(paybackText(r.roi, 'en')).toBe('7–11');
    expect(paybackText(r.roi, 'ar')).toBe('من 7 إلى 11');
  });

  it('is lead priority B', () => {
    expect(r.priority).toBe('B');
  });

  it('flags Q2, Q4, Q6 and Q7 as gaps, all scoring 1', () => {
    expect(r.gaps.map((g) => g.q.id)).toEqual(['q2', 'q4', 'q6', 'q7']);
    expect(r.gaps.every((g) => g.s === 1)).toBe(true);
  });

  it('writes the lead summary', () => {
    const text = handoffText(s, r, 'en');
    expect(text).toContain('Readiness: 52/100 · Ready for a scoped pilot');
    expect(text).toContain('Indicative scope: Compact · 6 weeks · AED 60K–90K');
    expect(text).toContain('Estimated value: 1,440 hours a year ≈ AED 100,800');
    expect(text).toContain('Lead priority: B · process audit, then a pilot proposal');
    expect(text).toContain('Gaps to close: Knowledge sources, Human checkpoints, Ownership after launch, Failure handling');
    expect(text).toContain('Company: Not given');
    expect(handoffText(s, r, 'ar')).toContain('1,440 ساعة سنوياً ≈ 100,800 درهم');
  });
});

describe('all answers at 3', () => {
  const s: State = { ...exampleState(), q: allThrees() };
  const r = compute(s);
  it('scores 100, "Ready to build", priority A, no gaps', () => {
    expect(r.score).toBe(100);
    expect(r.band).toBe('high');
    expect(t('en', 'band_high')).toBe('Ready to build');
    expect(r.priority).toBe('A');
    expect(r.gaps).toEqual([]);
    expect(handoffText(s, r, 'en')).toContain('Suggested next step: Scoping call for a Compact build');
  });
});

describe('government sector', () => {
  const r = compute({ ...exampleState(), sector: 'gov' });
  it('moves to Sovereign with an open-ended payback shown as "from N"', () => {
    expect(r.tier.id).toBe('sovereign');
    expect(r.reasons).toEqual(['r_gov']);
    expect(r.roi!.pbHi).toBeNull();
    // 1,500,000 / (100,800 / 12) = 178.6 → 179
    expect(r.roi!.pbLo).toBe(179);
    expect(paybackText(r.roi, 'en')).toBe('from 179');
    expect(paybackText(r.roi, 'ar')).toBe('من 179');
  });
});

describe('tier triggers', () => {
  it('systems 2–3 → Standard', () => {
    const r = computeTier({ ...exampleState(), systems: '2-3' });
    expect(r.tier.id).toBe('standard');
    expect(r.reasons).toEqual(['r_sys23']);
  });
  it('systems 4–6 and 7+ → Platform', () => {
    expect(computeTier({ ...exampleState(), systems: '4-6' }).tier.id).toBe('platform');
    expect(computeTier({ ...exampleState(), systems: '7+' }).tier.id).toBe('platform');
  });
  it('workflows 2–3 → Standard, 4+ → Platform', () => {
    expect(computeTier({ ...exampleState(), wfCount: '2-3' }).tier.id).toBe('standard');
    expect(computeTier({ ...exampleState(), wfCount: '4+' }).tier.id).toBe('platform');
  });
  it('team 201–1,000 → Standard, 1,000+ → Platform', () => {
    expect(computeTier({ ...exampleState(), size: 's201' }).tier.id).toBe('standard');
    expect(computeTier({ ...exampleState(), size: 's1000' }).tier.id).toBe('platform');
  });
  it('on-premise or air-gapped data → Sovereign', () => {
    const s = exampleState();
    expect(computeTier({ ...s, q: { ...s.q, q5: 'airgap' } }).tier.id).toBe('sovereign');
  });
  it('takes the highest trigger and keeps every reason', () => {
    const r = computeTier({ ...exampleState(), systems: '2-3', wfCount: '4+', size: 's201' });
    expect(r.tier.id).toBe('platform');
    expect(r.reasons).toEqual(['r_sys23', 'r_wf4', 'r_size201']);
  });
  it('asks for missing inputs', () => {
    const r = computeTier(blankState());
    expect(r.tier.id).toBe('compact');
    expect(r.reasons).toEqual(['r_pending']);
  });
  it('Standard payback is a closed range', () => {
    // 150,000 / 8,400 = 17.9 → 18; 350,000 / 8,400 = 41.7 → 42
    expect(paybackText(compute({ ...exampleState(), systems: '2-3' }).roi, 'en')).toBe('18–42');
  });
});

describe('incomplete answers', () => {
  it('give a null score and a pending priority', () => {
    const s = exampleState();
    delete s.q.q7;
    const r = compute(s);
    expect(r.answered).toBe(6);
    expect(r.score).toBeNull();
    expect(r.band).toBeNull();
    expect(r.priority).toBeNull();
    const text = handoffText(s, r, 'en');
    expect(text).toContain('Readiness: Incomplete (6/7 answered)');
    expect(text).toContain('Lead priority: To confirm once the check is complete');
  });
  it('a blank state has no score, no ROI and no gaps', () => {
    const r = compute(blankState());
    expect(r.score).toBeNull();
    expect(r.roi).toBeNull();
    expect(r.gaps).toEqual([]);
    expect(paybackText(r.roi, 'en')).toBe('—');
  });
});

describe('bands and priority boundaries', () => {
  it('splits at 40 and 70', () => {
    expect(bandFor(39)).toBe('low');
    expect(bandFor(40)).toBe('mid');
    expect(bandFor(69)).toBe('mid');
    expect(bandFor(70)).toBe('high');
    expect(leadPriority(39)).toBe('C');
    expect(leadPriority(40)).toBe('B');
    expect(leadPriority(69)).toBe('B');
    expect(leadPriority(70)).toBe('A');
  });
  it('a weak profile maps before it builds, with gaps sorted lowest first', () => {
    const q: State['q'] = { q1: 'a', q2: 'b', q3: 'a', q4: 'a', q5: 'unchecked', q6: 'a', q7: 'a' };
    const r = compute({ ...exampleState(), q });
    expect(r.score).toBe(5); // 1 / 21
    expect(r.band).toBe('low');
    expect(r.priority).toBe('C');
    expect(r.gaps.map((g) => g.s)).toEqual([0, 0, 0, 0, 0, 0, 1]);
    expect(r.gaps.at(-1)!.q.id).toBe('q2');
  });
  it('readinessScore needs all seven', () => {
    expect(readinessScore([3, 3, 3, 3, 3, 3, null])).toBeNull();
    expect(readinessScore(QUESTIONS.map(() => 2))).toBe(67);
  });
});

describe('ROI edge cases', () => {
  it('needs every number', () => {
    expect(compute({ ...exampleState(), rate: null }).roi).toBeNull();
    expect(compute({ ...exampleState(), people: 0 }).roi).toBeNull();
  });
  it('rounds value to the nearest AED 100', () => {
    // 3 × 7 × 48 × 35% = 352.8 h × AED 55 = 19,404 → 19,400
    const r = compute({ ...exampleState(), people: 3, hours: 7, rate: 55, share: 35 });
    expect(r.roi!.value).toBe(19400);
    expect(r.roi!.freed).toBe(353);
  });
  it('clamps out-of-range inputs to the form bounds', () => {
    expect(compute({ ...exampleState(), hours: 500 }).roi!.annual).toBe(4 * 60 * 48);
  });
  it('payback can run past the 36-month warning threshold', () => {
    expect(compute({ ...exampleState(), people: 1, hours: 2 }).roi!.pbLo).toBeGreaterThan(PAYBACK_WARN_MONTHS);
  });
});
