/* =====================================================================
   UltraChat AI Omega – web/joke-generator/app.js
   Joke Generator logic: joke pool, categories, reveal mechanic
   ===================================================================== */

'use strict';

/* ── Joke pool ────────────────────────────────────────────────────── */
const JOKES = [
  /* Programowanie */
  { category: 'programowanie', setup: 'Dlaczego programista nie lubi natury?', punchline: 'Bo ma za dużo bugów.' },
  { category: 'programowanie', setup: 'Jak programista mówi „do widzenia"?', punchline: 'undefined.' },
  { category: 'programowanie', setup: 'Co ma wspólnego kawior z JavaScript?', punchline: 'Oba są dobre, gdy są świeże, ale szybko śmierdzą.' },
  { category: 'programowanie', setup: 'Dlaczego Java jest jak pasta do zębów?', punchline: 'Bo obiecuje 9 z 10 dentystów, ale i tak boli.' },
  { category: 'programowanie', setup: 'Ile programistów potrzeba, żeby wymienić żarówkę?', punchline: 'Żadnego – to problem sprzętowy.' },

  /* AI */
  { category: 'AI', setup: 'Zapytałem ChatGPT o żarty.', punchline: 'Powiedział, że to nie jest jego specjalizacja, ale skompilował 50 przykładów.' },
  { category: 'AI', setup: 'Czym różni się AI od studenta?', punchline: 'AI nie śpi przed egzaminem – po prostu halucynuje od razu.' },
  { category: 'AI', setup: 'Dlaczego AI nie może być poetą?', punchline: 'Bo zawsze pyta: „Czy to jest poprawna odpowiedź?"' },

  /* Ogólne */
  { category: 'ogólne', setup: 'Dlaczego komputer jest zawsze zmęczony?', punchline: 'Bo ma za dużo okien otwartych.' },
  { category: 'ogólne', setup: 'Co mówi plik do folderu?', punchline: 'Mam do ciebie dokument!' },
  { category: 'ogólne', setup: 'Dlaczego algorytm poszedł do terapeuty?', punchline: 'Miał za dużo pętli nieskończonych.' },
  { category: 'ogólne', setup: 'Jaki jest ulubiony szampan programistów?', punchline: 'Git push –– pętelka.' },
];

/* ── State ────────────────────────────────────────────────────────── */
let state = {
  category: 'wszystkie',
  pool: [],
  currentIndex: 0,
  punchlineVisible: false,
  seen: 0,
};

/* ── Helpers ──────────────────────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPool(category) {
  const filtered = category === 'wszystkie'
    ? JOKES
    : JOKES.filter((j) => j.category === category);
  return shuffle(filtered);
}

/* ── DOM refs ─────────────────────────────────────────────────────── */
const setupEl      = document.getElementById('joke-setup');
const punchlineEl  = document.getElementById('joke-punchline');
const categoryEl   = document.getElementById('joke-category-badge');
const jokeCard     = document.getElementById('joke-card');
const revealBtn    = document.getElementById('reveal-btn');
const nextBtn      = document.getElementById('next-btn');
const scoreEl      = document.getElementById('joke-score');

/* ── Render current joke ──────────────────────────────────────────── */
function renderJoke() {
  const joke = state.pool[state.currentIndex];
  if (!joke) return;

  setupEl.textContent     = joke.setup;
  punchlineEl.textContent = '';
  categoryEl.textContent  = joke.category;
  state.punchlineVisible  = false;

  revealBtn.disabled = false;
  revealBtn.textContent = '😂 Pokaż puentę';
  nextBtn.disabled = true;
  updateScore();
}

/* ── Reveal punchline ─────────────────────────────────────────────── */
function revealPunchline() {
  const joke = state.pool[state.currentIndex];
  if (!joke) return;

  punchlineEl.textContent = joke.punchline;
  state.punchlineVisible  = true;
  revealBtn.disabled      = true;
  nextBtn.disabled        = false;
}

/* ── Next joke ────────────────────────────────────────────────────── */
function nextJoke() {
  state.seen++;
  state.currentIndex = (state.currentIndex + 1) % state.pool.length;
  renderJoke();
}

/* ── Category change ──────────────────────────────────────────────── */
function setCategory(cat) {
  state.category    = cat;
  state.pool        = buildPool(cat);
  state.currentIndex = 0;
  state.seen        = 0;
  renderJoke();
}

function updateScore() {
  if (scoreEl) {
    scoreEl.textContent = `Zobaczono: ${state.seen} / ${state.pool.length} żartów`;
  }
}

/* ── Event listeners ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Category buttons */
  document.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setCategory(btn.dataset.category);
    });
  });

  if (revealBtn) revealBtn.addEventListener('click', revealPunchline);
  if (nextBtn)   nextBtn.addEventListener('click', nextJoke);

  /* Start with "wszystkie" */
  state.pool = buildPool('wszystkie');
  renderJoke();
});

/* ── Exports ──────────────────────────────────────────────────────── */
if (typeof module !== 'undefined') {
  module.exports = { JOKES, shuffle, buildPool };
}
