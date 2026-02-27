'use strict';

/**
 * DRAGON-IA - Main entry point
 * Initializes the chat application and registers the service worker.
 */

var appModule;
if (typeof require !== 'undefined') {
  try {
    appModule = require('./src/app');
  } catch (e) {
    appModule = null;
  }
}

function _formatMessage(message) {
  if (appModule && appModule.formatMessage) return appModule.formatMessage(message);
  if (typeof formatMessage === 'function') return formatMessage(message);
  var label = message.sender === 'user' ? 'Ty' : 'DRAGON-IA';
  return label + ': ' + message.text;
}

function _validateInput(input) {
  if (appModule && appModule.validateInput) return appModule.validateInput(input);
  if (typeof validateInput === 'function') return validateInput(input);
  return typeof input === 'string' && input.trim().length > 0;
}

function _createMessage(text, sender) {
  if (appModule && appModule.createMessage) return appModule.createMessage(text, sender);
  if (typeof createMessage === 'function') return createMessage(text, sender);
  return { text: String(text).trim(), sender: sender, timestamp: Date.now() };
}

/**
 * Registers the PWA service worker.
 * @returns {Promise<boolean>}
 */
async function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      return true;
    } catch (err) {
      console.error('Service worker registration failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Initializes the chat UI.
 */
function initChat() {
  if (typeof document === 'undefined') return;

  const form = document.getElementById('chat-form');
  const input = document.getElementById('user-input');
  const messages = document.getElementById('messages');

  if (!form || !input || !messages) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value;
    if (!_validateInput(text)) return;

    const userMsg = _createMessage(text, 'user');
    appendMessage(messages, userMsg);
    input.value = '';

    // Simulate bot response
    setTimeout(function () {
      const botMsg = _createMessage('Dziękuję za wiadomość! Przetwarzam...', 'bot');
      appendMessage(messages, botMsg);
    }, 500);
  });
}

/**
 * Appends a message to the chat container.
 * @param {HTMLElement} container
 * @param {{ text: string, sender: string }} message
 */
function appendMessage(container, message) {
  if (!container || !message) return;
  const div = document.createElement('div');
  div.className = 'message ' + message.sender;
  div.textContent = _formatMessage(message);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    initChat();
    registerServiceWorker();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerServiceWorker, initChat, appendMessage };
}
