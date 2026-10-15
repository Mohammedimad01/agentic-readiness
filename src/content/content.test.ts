// Guards the "verbatim from the reference build" rule: every string the reference defines
// must appear here unchanged, except keys this build deliberately adds or rewords (NEW_STRINGS).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { STRINGS, NEW_STRINGS, type StringKey } from './i18n';
import { QUESTIONS, GAPFIX, WORKFLOWS, TIERS, PHASES, SECTORS, SIZES, WFCOUNT, SYSTEMS } from './data';

const html = readFileSync(new URL('../../reference/agentic-readiness.html', import.meta.url), 'utf8');

/** Evaluates one `const NAME = …;` literal from the reference file. */
function refConst<T>(name: string): T {
  const start = html.indexOf(`const ${name} = `);
  if (start < 0) throw new Error(`${name} not found in reference`);
  const isObject = html[start + `const ${name} = `.length] === '{';
  const end = html.indexOf(isObject ? '\n};' : '\n];', start) + 3;
  return new Function(`${html.slice(start, end)}\nreturn ${name};`)() as T;
}

describe('content parity with the reference build', () => {
  it('every reference string is present and unchanged', () => {
    const ref = refConst<Record<string, { en: string; ar: string }>>('S');
    expect(Object.keys(ref).length).toBeGreaterThanOrEqual(150);
    for (const [k, v] of Object.entries(ref)) {
      expect(STRINGS, k).toHaveProperty(k);
      if (NEW_STRINGS.includes(k as StringKey)) continue;
      expect(STRINGS[k as StringKey], k).toEqual(v);
    }
    // bar_note keeps the reference Arabic; only the English follows the build brief.
    expect(STRINGS.bar_note.ar).toBe(ref.bar_note.ar);
  });

  it('the split headline reassembles to the reference H1', () => {
    for (const l of ['en', 'ar'] as const) expect(`${STRINGS.h1_a[l]} ${STRINGS.h1_b[l]}`).toBe(STRINGS.h1[l]);
  });

  it('questions, options and scores match', () => {
    expect(QUESTIONS.map(({ key: _k, ...q }) => q)).toEqual(refConst('QUESTIONS'));
  });

  it('gap fixes, workflows, tiers, phases and choice lists match', () => {
    expect(GAPFIX).toEqual(refConst('GAPFIX'));
    expect(WORKFLOWS.map(({ tag: _t, ...w }) => w)).toEqual(refConst('WORKFLOWS'));
    expect(TIERS).toEqual(refConst('TIERS'));
    expect(PHASES).toEqual(refConst('PHASES'));
    expect(SECTORS).toEqual(refConst('SECTORS'));
    expect(SIZES).toEqual(refConst('SIZES'));
    expect(WFCOUNT).toEqual(refConst('WFCOUNT'));
    expect(SYSTEMS).toEqual(refConst('SYSTEMS'));
  });
});
