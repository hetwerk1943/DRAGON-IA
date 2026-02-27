/* =====================================================================
   UltraChat AI Omega – quiz.js
   Q&A quiz module: question pool, scoring, UI rendering
   ===================================================================== */

'use strict';

/* ── Question pool ────────────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 1,
    question: 'Który model OpenAI jest zoptymalizowany pod kątem rozumowania krok po kroku?',
    options: ['GPT-3.5 Turbo', 'DALL-E 3', 'o1', 'Whisper'],
    correct: 2,
    explanation: 'Model o1 (dawniej o1-preview) jest zoptymalizowany do złożonego rozumowania wieloetapowego.',
  },
  {
    id: 2,
    question: 'Co oznacza skrót PWA?',
    options: ['Portable Web App', 'Progressive Web App', 'Public Web API', 'Primary Web Asset'],
    correct: 1,
    explanation: 'PWA (Progressive Web App) to aplikacja webowa spełniająca kryteria instalacji i działania offline.',
  },
  {
    id: 3,
    question: 'Który plik jest wymagany do działania aplikacji jako PWA?',
    options: ['robots.txt', 'sitemap.xml', 'manifest.json', '.htaccess'],
    correct: 2,
    explanation: 'Plik manifest.json (web app manifest) informuje przeglądarkę o metadanych PWA.',
  },
  {
    id: 4,
    question: 'Jakie zdarzenie rejestrujemy w service workerze, aby obsługiwać zasoby offline?',
    options: ['install', 'fetch', 'activate', 'message'],
    correct: 1,
    explanation: 'Zdarzenie "fetch" przechwytuje żądania sieciowe i pozwala zwrócić odpowiedź z cache.',
  },
  {
    id: 5,
    question: 'Który HTTP status oznacza "Nie znaleziono"?',
    options: ['200', '301', '403', '404'],
    correct: 3,
    explanation: '404 Not Found – serwer nie znalazł żądanego zasobu.',
  },
  {
    id: 6,
    question: 'Co robi operator "spread" (...) w JavaScript?',
    options: [
      'Mnoży dwie liczby',
      'Rozszerza iterowalny obiekt na poszczególne elementy',
      'Tworzy strzałkową funkcję',
      'Deklaruje zmienną globalną',
    ],
    correct: 1,
    explanation: 'Spread (...) "rozpakuje" tablicę lub obiekt na osobne elementy.',
  },
  {
    id: 7,
    question: 'Jakie słowo kluczowe ES6 definiuje zmienną o zasięgu bloku?',
    options: ['var', 'let', 'def', 'func'],
    correct: 1,
    explanation: '"let" ma zasięg bloku ({...}), w przeciwieństwie do "var" o zasięgu funkcji.',
  },
  {
    id: 8,
    question: 'Co zwraca fetch() w JavaScript?',
    options: ['XMLHttpRequest', 'Promise<Response>', 'Callback', 'JSON string'],
    correct: 1,
    explanation: 'fetch() zwraca Promise, który resolves do obiektu Response.',
  },
];

/* ── State ────────────────────────────────────────────────────────── */
let quizState = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
};

/* ── Shuffle helper ───────────────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── DOM helpers ──────────────────────────────────────────────────── */
function $(id) { return document.getElementById(id); }

/* ── Render current question ──────────────────────────────────────── */
function renderQuestion() {
  const q = quizState.questions[quizState.currentIndex];
  if (!q) return;

  const questionEl = $('quiz-question');
  const optionsEl  = $('quiz-options');
  const progressEl = $('quiz-progress');
  const feedbackEl = $('quiz-feedback');

  if (questionEl) questionEl.textContent = q.question;
  if (progressEl) {
    progressEl.textContent =
      `Pytanie ${quizState.currentIndex + 1} / ${quizState.questions.length}  |  Wynik: ${quizState.score}`;
  }
  if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'quiz-feedback'; }

  if (optionsEl) {
    optionsEl.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(idx));
      optionsEl.appendChild(btn);
    });
  }

  quizState.answered = false;
}

/* ── Handle answer selection ──────────────────────────────────────── */
function handleAnswer(selectedIndex) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.currentIndex];
  const optionBtns = document.querySelectorAll('.quiz-option');
  const feedbackEl = $('quiz-feedback');
  const nextBtn    = $('quiz-next-btn');

  optionBtns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add('quiz-option--correct');
    else if (idx === selectedIndex) btn.classList.add('quiz-option--wrong');
  });

  if (selectedIndex === q.correct) {
    quizState.score++;
    if (feedbackEl) {
      feedbackEl.textContent = `✅ Poprawnie! ${q.explanation}`;
      feedbackEl.className = 'quiz-feedback quiz-feedback--correct';
    }
  } else {
    if (feedbackEl) {
      feedbackEl.textContent = `❌ Błąd. ${q.explanation}`;
      feedbackEl.className = 'quiz-feedback quiz-feedback--wrong';
    }
  }

  if (nextBtn) nextBtn.style.display = 'inline-block';
}

/* ── Advance to next question ─────────────────────────────────────── */
function nextQuestion() {
  quizState.currentIndex++;
  const nextBtn = $('quiz-next-btn');
  if (nextBtn) nextBtn.style.display = 'none';

  if (quizState.currentIndex >= quizState.questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

/* ── Show final score ─────────────────────────────────────────────── */
function showResults() {
  const questionEl = $('quiz-question');
  const optionsEl  = $('quiz-options');
  const feedbackEl = $('quiz-feedback');
  const resultEl   = $('quiz-result');
  const nextBtn    = $('quiz-next-btn');
  const restartBtn = $('quiz-restart-btn');

  if (questionEl) questionEl.textContent = 'Quiz zakończony!';
  if (optionsEl)  optionsEl.innerHTML = '';
  if (feedbackEl) feedbackEl.textContent = '';
  if (nextBtn)    nextBtn.style.display = 'none';

  const pct = Math.round((quizState.score / quizState.questions.length) * 100);
  if (resultEl) {
    resultEl.innerHTML =
      `Twój wynik: <strong>${quizState.score} / ${quizState.questions.length}</strong> (${pct}%)`;
    resultEl.style.display = 'block';
  }
  if (restartBtn) restartBtn.style.display = 'inline-block';
}

/* ── Restart quiz ─────────────────────────────────────────────────── */
function restartQuiz() {
  quizState = {
    questions: shuffle(QUESTIONS),
    currentIndex: 0,
    score: 0,
    answered: false,
  };

  const resultEl   = $('quiz-result');
  const restartBtn = $('quiz-restart-btn');
  if (resultEl)   resultEl.style.display = 'none';
  if (restartBtn) restartBtn.style.display = 'none';

  renderQuestion();
}

/* ── Initialisation ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const nextBtn    = $('quiz-next-btn');
  const restartBtn = $('quiz-restart-btn');

  if (nextBtn)    nextBtn.addEventListener('click', nextQuestion);
  if (restartBtn) restartBtn.addEventListener('click', restartQuiz);

  restartQuiz();
});

/* ── Exports ──────────────────────────────────────────────────────── */
if (typeof module !== 'undefined') {
  module.exports = { QUESTIONS, shuffle, handleAnswer, nextQuestion, restartQuiz };
}
