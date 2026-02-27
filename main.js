/* main.js – DragonAI main entry point */
'use strict';

import { askAgent } from './agent.js';
import { getCurrentQuestion, submitAnswer, resetQuiz } from './quiz.js';

/* ── AdSense ON/OFF ─────────────────────────────────────────────── */
const ADS_STORAGE_KEY = 'dragonai_ads_enabled';

function isAdsEnabled() {
  return localStorage.getItem(ADS_STORAGE_KEY) !== 'false';
}

function setAdsEnabled(enabled) {
  localStorage.setItem(ADS_STORAGE_KEY, String(enabled));
  renderAdSlots();
}

function renderAdSlots() {
  const slots = document.querySelectorAll('.ad-slot');
  const enabled = isAdsEnabled();
  slots.forEach((slot) => {
    slot.style.display = enabled ? 'block' : 'none';
  });
}

/* ── Chat ────────────────────────────────────────────────────────── */
/** @type {Array<{role:string, content:string}>} */
const chatHistory = [];

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = `message message--${role}`;
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

async function handleSend() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  try {
    const reply = await askAgent(text, chatHistory.slice(0, -1));
    appendMessage('assistant', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    appendMessage('assistant', 'Wystąpił błąd. Spróbuj ponownie.');
    console.error('Agent error:', err);
  }
}

/* ── Quiz UI ─────────────────────────────────────────────────────── */
function renderQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  const q = getCurrentQuestion();
  if (!q) {
    container.innerHTML = '<p class="quiz-done">Quiz zakończony! 🎉</p>';
    return;
  }

  container.innerHTML = `
    <p class="quiz-question">(${q.index + 1}/${q.total}) ${q.question}</p>
    <ul class="quiz-options">
      ${q.options
        .map(
          (opt, i) =>
            `<li><button class="quiz-option" data-index="${i}">${opt}</button></li>`
        )
        .join('')}
    </ul>
  `;

  container.querySelectorAll('.quiz-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const total = q.total;
      const result = submitAnswer(Number(btn.dataset.index));
      if (result.done) {
        container.innerHTML = `<p class="quiz-done">Wynik: ${result.score}/${total} 🎯</p>
          <button id="quiz-restart">Zacznij od nowa</button>`;
        document.getElementById('quiz-restart')?.addEventListener('click', () => {
          resetQuiz();
          renderQuiz();
        });
      } else {
        renderQuiz();
      }
    });
  });
}

/* ── Service Worker ──────────────────────────────────────────────── */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.error('SW registration failed:', err));
  }
}

/* ── Bootstrap ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  renderAdSlots();
  renderQuiz();

  document.getElementById('send-btn')?.addEventListener('click', handleSend);
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  const adsToggle = document.getElementById('ads-toggle');
  if (adsToggle) {
    adsToggle.checked = isAdsEnabled();
    adsToggle.addEventListener('change', () => setAdsEnabled(adsToggle.checked));
  }
});
