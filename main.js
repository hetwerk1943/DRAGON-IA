'use strict';

/**
 * main.js – Entry point for DRAGON-IA UltraChat AI Omega
 * Registers the Service Worker, initialises modules, and wires up the UI.
 */

import Agent from './agent.js';
import Quiz from './quiz.js';

// ─── Service Worker Registration ─────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.error('SW registration failed:', err));
  });
}

// ─── AdSense Toggle ───────────────────────────────────────────────────────────

/**
 * AdSense is loaded only when the user has NOT opted out.
 * The preference is stored in localStorage under 'adsense_enabled'.
 */
function isAdsenseEnabled() {
  return localStorage.getItem('adsense_enabled') !== 'false';
}

function setAdsenseEnabled(enabled) {
  localStorage.setItem('adsense_enabled', String(enabled));
}

function loadAdsense() {
  if (document.getElementById('adsense-script')) return;
  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.async = true;
  // Replace YOUR_PUB_ID with your real AdSense publisher ID before deploying.
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

function removeAdsense() {
  const script = document.getElementById('adsense-script');
  if (script) script.remove();
  document.querySelectorAll('.adsbygoogle').forEach((el) => {
    el.innerHTML = '';
  });
}

function applyAdsense() {
  if (isAdsenseEnabled()) {
    loadAdsense();
  } else {
    removeAdsense();
  }
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function appendMessage(role, text) {
  const chatLog = document.getElementById('chat-log');
  if (!chatLog) return;

  const item = document.createElement('div');
  item.className = `message message--${role}`;
  item.textContent = text;
  chatLog.appendChild(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setLoading(isLoading) {
  const btn = document.getElementById('send-btn');
  if (btn) btn.disabled = isLoading;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

async function handleSend() {
  const input = document.getElementById('chat-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  appendMessage('user', text);
  setLoading(true);

  try {
    const reply = await Agent.sendMessage(text);
    appendMessage('assistant', reply);
  } catch (err) {
    appendMessage('assistant', `Błąd: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

async function handleQuizStart() {
  const quizContainer = document.getElementById('quiz-container');
  if (!quizContainer) return;

  quizContainer.innerHTML = '<p>Ładowanie pytania…</p>';

  try {
    const q = await Quiz.fetchQuestion();
    renderQuestion(quizContainer, q);
  } catch (err) {
    quizContainer.innerHTML = `<p class="error">Błąd: ${err.message}</p>`;
  }
}

function renderQuestion(container, question) {
  container.innerHTML = '';

  const qEl = document.createElement('p');
  qEl.className = 'quiz-question';
  qEl.textContent = question.question;
  container.appendChild(qEl);

  question.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = option;
    btn.addEventListener('click', () => {
      const result = Quiz.submitAnswer(idx);
      const { score, total } = result;
      container.innerHTML = `
        <p class="${result.correct ? 'correct' : 'incorrect'}">
          ${result.correct ? '✅ Poprawnie!' : '❌ Błędnie!'}
        </p>
        <p>Wynik: ${score}/${total}</p>
        <button id="next-question-btn">Następne pytanie</button>
      `;
      document.getElementById('next-question-btn').addEventListener('click', handleQuizStart);
    });
    container.appendChild(btn);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  applyAdsense();

  // Send button
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  // Chat input – Enter key
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // Clear chat
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      Agent.clearHistory();
      const chatLog = document.getElementById('chat-log');
      if (chatLog) chatLog.innerHTML = '';
    });
  }

  // AdSense toggle
  const adsToggle = document.getElementById('ads-toggle');
  if (adsToggle) {
    adsToggle.checked = isAdsenseEnabled();
    adsToggle.addEventListener('change', () => {
      setAdsenseEnabled(adsToggle.checked);
      applyAdsense();
    });
  }

  // Quiz
  const quizBtn = document.getElementById('quiz-start-btn');
  if (quizBtn) {
    quizBtn.addEventListener('click', handleQuizStart);
  }

  // Tab switching
  document.querySelectorAll('[data-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      const target = tabBtn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.hidden = panel.id !== target;
      });
      document.querySelectorAll('[data-tab]').forEach((t) => {
        t.setAttribute('aria-selected', t === tabBtn ? 'true' : 'false');
      });
    });
  });

  // Activate tab from URL param
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode) {
    const tabBtn = document.querySelector(`[data-tab="${mode}-panel"]`);
    if (tabBtn) tabBtn.click();
  }
}

document.addEventListener('DOMContentLoaded', init);
