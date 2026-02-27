/**
 * quiz.js – Moduł quizów / testów
 *
 * Provides a self-contained Quiz engine that renders a multiple-choice
 * quiz inside any container element.
 *
 * Usage:
 *   const quiz = new Quiz(questions, containerElement);
 *   quiz.start();
 */

/**
 * @typedef {Object} Question
 * @property {string} question   – Question text
 * @property {string[]} options  – Answer options (2-6 items)
 * @property {number} answer     – Zero-based index of the correct option
 * @property {string} [explanation] – Optional explanation shown after answering
 */

class Quiz {
  /**
   * @param {Question[]} questions
   * @param {HTMLElement} container
   */
  constructor(questions, container) {
    this.questions = questions;
    this.container = container;
    this.current = 0;
    this.score = 0;
    this.answered = false;
  }

  /** Render the quiz from the first question. */
  start() {
    this.current = 0;
    this.score = 0;
    this._render();
  }

  /** Render the current question. */
  _render() {
    const q = this.questions[this.current];
    this.answered = false;

    this.container.innerHTML = `
      <div class="quiz-progress">
        Pytanie ${this.current + 1} / ${this.questions.length}
        &nbsp;|&nbsp; Wynik: <strong>${this.score}</strong>
      </div>
      <div class="quiz-question">${this._escape(q.question)}</div>
      <ul class="quiz-options">
        ${q.options
          .map(
            (opt, i) =>
              `<li>
                <button class="quiz-option" data-index="${i}">
                  ${this._escape(opt)}
                </button>
              </li>`
          )
          .join('')}
      </ul>
      <div class="quiz-feedback" id="quiz-feedback"></div>
      <div class="quiz-nav" id="quiz-nav" style="display:none">
        <button id="quiz-next">
          ${this.current + 1 < this.questions.length ? 'Następne →' : 'Zakończ quiz'}
        </button>
      </div>
    `;

    this.container.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (this.answered) return;
        const chosen = Number(e.currentTarget.dataset.index);
        this._evaluate(chosen, q);
      });
    });
  }

  /**
   * Evaluate the chosen answer.
   * @param {number} chosen
   * @param {Question} q
   */
  _evaluate(chosen, q) {
    this.answered = true;
    const correct = q.answer;
    const feedback = this.container.querySelector('#quiz-feedback');
    const nav = this.container.querySelector('#quiz-nav');

    this.container.querySelectorAll('.quiz-option').forEach((btn, i) => {
      btn.disabled = true;
      if (i === correct) btn.classList.add('correct');
      if (i === chosen && chosen !== correct) btn.classList.add('wrong');
    });

    if (chosen === correct) {
      this.score++;
      feedback.textContent = '✅ Poprawna odpowiedź!';
      feedback.className = 'quiz-feedback quiz-correct';
    } else {
      feedback.textContent = `❌ Błędna. Poprawna odpowiedź: „${this._escape(q.options[correct])}"`;
      feedback.className = 'quiz-feedback quiz-wrong';
    }

    if (q.explanation) {
      const exp = document.createElement('p');
      exp.className = 'quiz-explanation';
      exp.textContent = q.explanation;
      feedback.appendChild(exp);
    }

    nav.style.display = '';
    const nextBtn = this.container.querySelector('#quiz-next');
    nextBtn.addEventListener('click', () => {
      this.current++;
      if (this.current < this.questions.length) {
        this._render();
      } else {
        this._renderResult();
      }
    });
  }

  /** Render the final score. */
  _renderResult() {
    const pct = Math.round((this.score / this.questions.length) * 100);
    this.container.innerHTML = `
      <div class="quiz-result">
        <h2>Wynik końcowy</h2>
        <p class="quiz-score">${this.score} / ${this.questions.length} (${pct}%)</p>
        <p>${pct >= 80 ? '🎉 Świetny wynik!' : pct >= 50 ? '👍 Dobry wynik.' : '📚 Warto powtórzyć materiał.'}</p>
        <button id="quiz-restart">Zacznij od nowa</button>
      </div>
    `;
    this.container.querySelector('#quiz-restart').addEventListener('click', () => this.start());
  }

  /** HTML-escape a string. */
  _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

/* ── Default sample quiz ─────────────────────────────────────────────────── */
const SAMPLE_QUESTIONS = [
  {
    question: 'Co oznacza skrót AI?',
    options: ['Automated Interface', 'Artificial Intelligence', 'Advanced Input', 'Augmented Interaction'],
    answer: 1,
    explanation: 'AI – Artificial Intelligence (Sztuczna Inteligencja).'
  },
  {
    question: 'Który z poniższych modeli jest modelem językowym OpenAI?',
    options: ['BERT', 'LLaMA', 'GPT-4', 'PaLM'],
    answer: 2,
    explanation: 'GPT-4 jest modelem stworzonym przez OpenAI.'
  },
  {
    question: 'PWA to skrót od…',
    options: ['Private Web App', 'Progressive Web App', 'Portable Web Agent', 'Proxy Web API'],
    answer: 1,
    explanation: 'PWA – Progressive Web App umożliwia instalację aplikacji webowej na urządzeniu.'
  },
  {
    question: 'Który standard CSS umożliwia tworzenie layoutów siatki?',
    options: ['Flexbox', 'Grid', 'Float', 'Position'],
    answer: 1,
    explanation: 'CSS Grid to specjalny moduł układu dwuwymiarowego.'
  }
];

/* ── Auto-init when a #quiz-container element exists ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  const quiz = new Quiz(SAMPLE_QUESTIONS, container);
  quiz.start();
});
