/* agent.js — AI agent chat logic for DRAGON-IA */
"use strict";

/**
 * Simple AI agent that generates responses.
 * In production, this would call the backend API which proxies to OpenAI.
 */
var Agent = (function () {
  var _history = [];

  /**
   * Send a user message and receive a bot reply.
   * @param {string} userMessage
   * @returns {string} bot response
   */
  function chat(userMessage) {
    if (typeof userMessage !== "string" || userMessage.trim() === "") {
      return "Proszę wpisać wiadomość.";
    }

    _history.push({ role: "user", content: userMessage });

    var reply = _generateReply(userMessage);
    _history.push({ role: "assistant", content: reply });

    return reply;
  }

  /**
   * Generate a placeholder reply based on keywords.
   * @param {string} message
   * @returns {string}
   */
  function _generateReply(message) {
    var lower = message.toLowerCase();

    if (lower.indexOf("cześć") !== -1 || lower.indexOf("hej") !== -1) {
      return "Cześć! Jak mogę Ci pomóc?";
    }
    if (lower.indexOf("pomoc") !== -1 || lower.indexOf("help") !== -1) {
      return "Jestem DRAGON-IA, Twój asystent AI. Zapytaj mnie o cokolwiek!";
    }
    if (lower.indexOf("quiz") !== -1) {
      return 'Przejdź do zakładki Quiz, aby rozpocząć interaktywny quiz!';
    }

    return "Dziękuję za wiadomość. Przetwarzam Twoje zapytanie…";
  }

  /**
   * Return conversation history.
   * @returns {Array}
   */
  function getHistory() {
    return _history.slice();
  }

  /**
   * Clear conversation history.
   */
  function clearHistory() {
    _history = [];
  }

  return {
    chat: chat,
    getHistory: getHistory,
    clearHistory: clearHistory
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Agent;
}
