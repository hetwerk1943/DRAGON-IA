/* quiz.js — Quiz module for DRAGON-IA */
"use strict";

var Quiz = (function () {
  var _questions = [
    {
      question: "Co oznacza skrót AI?",
      options: [
        "Artificial Intelligence",
        "Advanced Interface",
        "Auto Integration"
      ],
      answer: 0
    },
    {
      question: "Który język jest najczęściej używany w web development?",
      options: ["Python", "JavaScript", "C++"],
      answer: 1
    },
    {
      question: "Co to jest PWA?",
      options: [
        "Progressive Web App",
        "Personal Web Account",
        "Private Wireless Access"
      ],
      answer: 0
    }
  ];

  var _currentIndex = 0;
  var _score = 0;

  /**
   * Start or restart the quiz.
   * @returns {object|null} first question or null if empty
   */
  function start() {
    _currentIndex = 0;
    _score = 0;
    return _currentQuestion();
  }

  /**
   * Submit an answer for the current question.
   * @param {number} selectedIndex
   * @returns {object} result with correct flag and next question or summary
   */
  function answer(selectedIndex) {
    var q = _questions[_currentIndex];
    if (!q) {
      return { done: true, score: _score, total: _questions.length };
    }

    var correct = selectedIndex === q.answer;
    if (correct) {
      _score++;
    }

    _currentIndex++;

    var next = _currentQuestion();
    return {
      correct: correct,
      done: next === null,
      score: _score,
      total: _questions.length,
      next: next
    };
  }

  /**
   * Get the current question object or null if quiz is done.
   * @returns {object|null}
   */
  function _currentQuestion() {
    if (_currentIndex >= _questions.length) {
      return null;
    }
    var q = _questions[_currentIndex];
    return {
      index: _currentIndex,
      question: q.question,
      options: q.options.slice()
    };
  }

  return {
    start: start,
    answer: answer
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Quiz;
}
