// The single client island: holds the answers, re-renders every live region on input,
// and runs the copy button, booking note, language switch and builder's-note dialog.
import type { Lang } from '../content/data';
import { t } from '../content/i18n';
import {
  compute, exampleState, blankState, handoffText, workflowById, type State,
} from '../lib/scoring';
import {
  panelHead, scoreBlock, tierBlock, roiBlock, radarSVG, terminalRows, briefEyebrow, gapsBlock,
  workflowBlock, phasesMeta, phasesBlock, ladderRows, mobileBar, liveSummary, shareHint,
} from '../lib/render';

const lang = (document.documentElement.lang === 'ar' ? 'ar' : 'en') as Lang;
const other: Lang = lang === 'en' ? 'ar' : 'en';
const STATE_KEY = 'arc-state';
const LANG_KEY = 'arc-lang';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const store = {
  get(area: 'local' | 'session', key: string): string | null {
    try { return (area === 'local' ? localStorage : sessionStorage).getItem(key); } catch { return null; }
  },
  set(area: 'local' | 'session', key: string, v: string) {
    try { (area === 'local' ? localStorage : sessionStorage).setItem(key, v); } catch { /* storage blocked */ }
  },
  del(area: 'local' | 'session', key: string) {
    try { (area === 'local' ? localStorage : sessionStorage).removeItem(key); } catch { /* storage blocked */ }
  },
};

/* ---------- #ar / #en open the other language ---------- */
const switchUrl = $<HTMLAnchorElement>(`a[data-lang-switch="${other}"]`)?.href;
const redirecting = location.hash === `#${other}` && !!switchUrl;
if (redirecting) {
  store.set('local', LANG_KEY, other);
  location.replace(switchUrl!);
} else {
  store.set('local', LANG_KEY, lang);
}

/* ---------- state ---------- */
let state: State = exampleState();
let isExample = true;

// Answers carried across a language switch (sessionStorage, this tab only).
const carried = store.get('session', STATE_KEY);
if (carried) {
  store.del('session', STATE_KEY);
  try {
    const parsed = JSON.parse(carried) as { state: State; isExample: boolean };
    if (parsed && parsed.state && typeof parsed.state === 'object') {
      state = { ...blankState(), ...parsed.state, q: { ...parsed.state.q } };
      isExample = !!parsed.isExample;
    }
  } catch { /* ignore malformed */ }
}

const form = $<HTMLFormElement>('#form')!;
const field = <T extends HTMLInputElement | HTMLSelectElement>(name: string) => form.querySelector<T>(`[data-field="${name}"]`)!;

function writeForm() {
  (field<HTMLInputElement>('company')).value = state.company;
  for (const f of ['sector', 'size', 'wfCount', 'systems'] as const) field<HTMLSelectElement>(f).value = state[f];
  for (const f of ['people', 'hours', 'rate'] as const) field<HTMLInputElement>(f).value = state[f] == null ? '' : String(state[f]);
  field<HTMLInputElement>('share').value = String(state.share);
  form.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((r) => {
    r.checked = r.name === 'workflow' ? r.value === state.workflow : state.q[r.name as keyof State['q']] === r.value;
  });
}

/* ---------- render ---------- */
const set = (sel: string, html: string) => { const el = $(sel); if (el && el.innerHTML !== html) el.innerHTML = html; };
let liveTimer: number | undefined;

function render() {
  const r = compute(state);
  set('#term-rows', terminalRows(r, lang));
  set('#panel-head', panelHead(r, lang));
  set('#score', scoreBlock(r, lang));
  set('#radar', radarSVG(r.scores, lang));
  set('#tier', tierBlock(r, lang));
  set('#roi', roiBlock(r, lang));
  set('#brief-eyebrow', briefEyebrow(state, lang));
  set('#gaps', gapsBlock(r, lang));
  set('#wf-card', workflowBlock(state, r, lang));
  set('#phases-meta', phasesMeta(r, lang));
  set('#phases', phasesBlock(r, lang));
  set('#ladder', ladderRows(r, lang));
  set('#mbar', mobileBar(r, lang));
  $('#handoff')!.textContent = handoffText(state, r, lang);
  $('#share-out')!.textContent = `${state.share}%`;
  $('#share-hint')!.textContent = shareHint(state, lang);

  const notice = $('#notice')!;
  notice.classList.toggle('is-own', !isExample);
  $('#notice-text')!.textContent = t(lang, isExample ? 'ex_note' : 'own_note');

  // Announce the headline result once the user pauses, not on every keystroke.
  window.clearTimeout(liveTimer);
  liveTimer = window.setTimeout(() => { $('#live')!.textContent = liveSummary(r, lang); }, 700);
}

/* ---------- input ---------- */
function onInput(e: Event) {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  if (el instanceof HTMLInputElement && el.type === 'radio') {
    if (!el.checked) return;
    if (el.name === 'workflow') {
      state.workflow = el.value;
      const wf = workflowById(el.value);
      if (wf && !state.shareTouched) {
        state.share = wf.share;
        field<HTMLInputElement>('share').value = String(wf.share);
      }
    } else {
      state.q = { ...state.q, [el.name]: el.value };
    }
  } else if (el.dataset.field) {
    const f = el.dataset.field;
    if (f === 'people' || f === 'hours' || f === 'rate' || f === 'share') {
      const v = el.value === '' ? null : Number(el.value);
      const n = v == null || Number.isNaN(v) ? null : v;
      if (f === 'share') { state.share = n ?? state.share; state.shareTouched = true; } else state[f] = n;
    } else if (f === 'company' || f === 'sector' || f === 'size' || f === 'wfCount' || f === 'systems') {
      state[f] = el.value;
    }
  } else return;
  isExample = false;
  render();
}
form.addEventListener('input', onInput);
form.addEventListener('change', onInput);
form.addEventListener('submit', (e) => e.preventDefault());

$('#btn-blank')!.addEventListener('click', () => {
  state = blankState(); isExample = false; writeForm(); render();
  field<HTMLSelectElement>('sector').focus();
});
$('#btn-example')!.addEventListener('click', () => {
  state = exampleState(); isExample = true; writeForm(); render();
});

/* ---------- lead summary ---------- */
const msg = $('#copy-msg')!;
$('#btn-copy')!.addEventListener('click', () => {
  const pre = $('#handoff')!;
  const fallback = () => {
    try {
      const range = document.createRange();
      range.selectNodeContents(pre);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(range);
    } catch { /* selection unavailable */ }
    pre.focus();
    msg.textContent = t(lang, 'copy_fail');
  };
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(pre.textContent ?? '').then(() => { msg.textContent = t(lang, 'copied'); }, fallback);
    } else fallback();
  } catch { fallback(); }
});
$('#btn-book')!.addEventListener('click', () => { msg.textContent = t(lang, 'book_note'); });

/* ---------- language switch keeps the answers ---------- */
document.querySelectorAll<HTMLAnchorElement>('a[data-lang-switch]').forEach((a) => {
  a.addEventListener('click', () => {
    store.set('local', LANG_KEY, a.dataset.langSwitch!);
    store.set('session', STATE_KEY, JSON.stringify({ state, isExample }));
  });
});

/* ---------- builder's note dialog ---------- */
const note = $<HTMLDialogElement>('#note')!;
let opener: HTMLElement | null = null;

function openNote(from?: HTMLElement | null) {
  opener = from ?? (document.activeElement as HTMLElement | null);
  if (note.open) return;
  if (typeof note.showModal === 'function') note.showModal(); else note.setAttribute('open', '');
  note.querySelector<HTMLElement>('[data-close-note]')?.focus();
  if (location.hash !== '#note') history.replaceState(null, '', '#note');
}
function closeNote() {
  if (typeof note.close === 'function' && note.open) note.close(); else note.removeAttribute('open');
}
note.addEventListener('close', () => {
  if (location.hash === '#note') history.replaceState(null, '', location.pathname + location.search);
  opener?.focus();
  opener = null;
});
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-open-note]');
  if (btn) openNote(btn);
});
note.addEventListener('click', (e) => {
  // Backdrop clicks land on the <dialog> element itself, outside its content box.
  if (e.target === note) closeNote();
  if ((e.target as HTMLElement).closest('[data-close-note]')) closeNote();
});
note.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeNote(); return; }
  if (e.key !== 'Tab') return;
  // Keep focus inside the dialog (showModal already makes the page inert; this covers the fallback).
  const focusables = [...note.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hasAttribute('disabled'));
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
window.addEventListener('hashchange', () => { if (location.hash === '#note') openNote(); });

/* ---------- boot ---------- */
// The server already rendered the worked example, so only re-render when answers were carried over.
writeForm(); // also overrides any values the browser restored from its form cache
if (carried) render();
if (location.hash === '#note') openNote();
