'use strict';

/**
 * DRAGON-IA - App module
 * Handles chat UI interaction and message management.
 */

/**
 * Creates a message element.
 * @param {string} text - The message text.
 * @param {'user'|'bot'} sender - The sender type.
 * @returns {{ text: string, sender: string, timestamp: number }}
 */
function createMessage(text, sender) {
  return {
    text: String(text).trim(),
    sender: sender,
    timestamp: Date.now(),
  };
}

/**
 * Formats a message for display.
 * @param {{ text: string, sender: string }} message
 * @returns {string}
 */
function formatMessage(message) {
  if (!message || !message.text) return '';
  const label = message.sender === 'user' ? 'Ty' : 'DRAGON-IA';
  return `${label}: ${message.text}`;
}

/**
 * Validates user input.
 * @param {string} input
 * @returns {boolean}
 */
function validateInput(input) {
  return typeof input === 'string' && input.trim().length > 0;
}

/**
 * Sanitizes input to prevent XSS.
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createMessage, formatMessage, validateInput, sanitizeInput };
}
