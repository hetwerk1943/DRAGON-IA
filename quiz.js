"use strict";

/**
 * DRAGON-IA Quiz module
 * Handles quiz logic and rendering.
 */

var Quiz = (function () {
  var questions = [];
  var currentIndex = 0;
  var score = 0;

  /**
   * Load questions from the backend.
   * @param {function} callback
   */
  function loadQuestions(callback) {
    fetch("/api/quiz")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load quiz questions: " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        questions = data.questions || [];
        currentIndex = 0;
        score = 0;
        callback(null, questions);
      })
      .catch(function (error) {
        console.error("Quiz load error:", error);
        callback(error, null);
      });
  }

  /**
   * Return the current question or null if done.
   * @returns {object|null}
   */
  function getCurrentQuestion() {
    if (currentIndex < questions.length) {
      return questions[currentIndex];
    }
    return null;
  }

  /**
   * Submit an answer for the current question.
   * @param {string} answer
   * @returns {boolean} whether the answer was correct
   */
  function submitAnswer(answer) {
    var question = getCurrentQuestion();
    if (!question) {
      return false;
    }
    var correct = question.correct === answer;
    if (correct) {
      score += 1;
    }
    currentIndex += 1;
    return correct;
  }

  /**
   * Get the final score.
   * @returns {number}
   */
  function getScore() {
    return score;
  }

  /**
   * Get total number of questions.
   * @returns {number}
   */
  function getTotalQuestions() {
    return questions.length;
  }

  return {
    loadQuestions: loadQuestions,
    getCurrentQuestion: getCurrentQuestion,
    submitAnswer: submitAnswer,
    getScore: getScore,
    getTotalQuestions: getTotalQuestions
  };
})();
