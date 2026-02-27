/* quiz.js – DragonAI Quiz module */
'use strict';

/** @type {Array<{question:string, options:string[], answer:number}>} */
const QUESTIONS = [
  {
    question: 'Czym jest sztuczna inteligencja?',
    options: [
      'Zdolność maszyn do naśladowania ludzkiej inteligencji',
      'Nowy język programowania',
      'Baza danych',
      'System operacyjny'
    ],
    answer: 0
  },
  {
    question: 'Co oznacza skrót PWA?',
    options: [
      'Progressive Web App',
      'Private Web Access',
      'Public Web API',
      'Programmatic Web Agent'
    ],
    answer: 0
  },
  {
    question: 'Który protokół zapewnia szyfrowanie połączenia?',
    options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
    answer: 2
  }
];

let currentIndex = 0;
let score = 0;

/**
 * Returns the current quiz question or null when the quiz is complete.
 * @returns {{question:string, options:string[], index:number, total:number}|null}
 */
function getCurrentQuestion() {
  if (currentIndex >= QUESTIONS.length) return null;
  const q = QUESTIONS[currentIndex];
  return {
    question: q.question,
    options: q.options,
    index: currentIndex,
    total: QUESTIONS.length
  };
}

/**
 * Submits an answer for the current question.
 * @param {number} selectedIndex
 * @returns {{correct:boolean, score:number, done:boolean}}
 */
function submitAnswer(selectedIndex) {
  const q = QUESTIONS[currentIndex];
  const correct = selectedIndex === q.answer;
  if (correct) score += 1;
  currentIndex += 1;
  return { correct, score, done: currentIndex >= QUESTIONS.length };
}

/** Resets the quiz to the beginning. */
function resetQuiz() {
  currentIndex = 0;
  score = 0;
}

export { getCurrentQuestion, submitAnswer, resetQuiz };
