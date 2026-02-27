'use strict';

/**
 * quiz.js – Quiz module for DRAGON-IA UltraChat
 * Generates and evaluates AI-powered quiz questions.
 */

const Quiz = (() => {
  const API_ENDPOINT = '/api/quiz';

  let currentQuestion = null;
  let score = 0;
  let totalAnswered = 0;

  /**
   * Fetch a new quiz question from the API.
   * @param {string} [topic='general'] - Topic for the quiz question.
   * @returns {Promise<{question: string, options: string[], correctIndex: number}>}
   */
  async function fetchQuestion(topic = 'general') {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    if (!response.ok) {
      throw new Error(`Quiz API error: ${response.status} ${response.statusText}`);
    }

    currentQuestion = await response.json();
    return currentQuestion;
  }

  /**
   * Submit an answer for the current question.
   * @param {number} answerIndex - Index of the chosen answer option.
   * @returns {{correct: boolean, score: number, total: number}}
   */
  function submitAnswer(answerIndex) {
    if (!currentQuestion) {
      throw new Error('No active question. Call fetchQuestion() first.');
    }

    totalAnswered += 1;
    const correct = answerIndex === currentQuestion.correctIndex;
    if (correct) score += 1;

    const result = { correct, score, total: totalAnswered };
    currentQuestion = null;
    return result;
  }

  /**
   * Reset quiz score and state.
   */
  function reset() {
    currentQuestion = null;
    score = 0;
    totalAnswered = 0;
  }

  /**
   * Get current score summary.
   * @returns {{score: number, total: number, percentage: number}}
   */
  function getScore() {
    const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    return { score, total: totalAnswered, percentage };
  }

  return { fetchQuestion, submitAnswer, reset, getScore };
})();

export default Quiz;
