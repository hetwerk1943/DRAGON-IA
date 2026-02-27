'use strict';

/**
 * agent.js – AI Agent module for DRAGON-IA UltraChat
 * Handles communication with the backend AI API.
 */

const Agent = (() => {
  const API_ENDPOINT = '/api/chat';
  const MAX_HISTORY = 20;

  let conversationHistory = [];

  /**
   * Send a message to the AI agent and receive a response.
   * @param {string} userMessage
   * @returns {Promise<string>}
   */
  async function sendMessage(userMessage) {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new TypeError('userMessage must be a non-empty string');
    }

    conversationHistory.push({ role: 'user', content: userMessage.trim() });

    // Keep history within limits
    if (conversationHistory.length > MAX_HISTORY * 2) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY * 2);
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.reply || data.message || '';

    conversationHistory.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  }

  /**
   * Clear conversation history.
   */
  function clearHistory() {
    conversationHistory = [];
  }

  /**
   * Get a copy of the current conversation history.
   * @returns {Array<{role: string, content: string}>}
   */
  function getHistory() {
    return [...conversationHistory];
  }

  return { sendMessage, clearHistory, getHistory };
})();

export default Agent;
