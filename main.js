/* =====================================================================
   UltraChat AI Omega – main.js
   Core AI chat logic: API calls, conversation history, UI updates
   ===================================================================== */

'use strict';

/* ── Configuration ────────────────────────────────────────────────── */
const CONFIG = {
  apiEndpoint: '/api/chat',       // Backend proxy endpoint (keeps API key server-side)
  defaultModel: 'gpt-4o-mini',
  maxTokens: 2048,
  temperature: 0.7,
  historyLimit: 20,               // Maximum messages kept in context
};

/* ── State ────────────────────────────────────────────────────────── */
let conversationHistory = [];
let isStreaming = false;
let selectedModel = CONFIG.defaultModel;
let tokenCount = 0;

/* ── DOM helpers (safe; called after DOMContentLoaded) ────────────── */
function $(id) { return document.getElementById(id); }

function appendMessage(role, content) {
  const messagesEl = $('chat-messages');
  if (!messagesEl) return null;

  const div = document.createElement('div');
  div.className = `message message--${role === 'user' ? 'user' : 'ai'}`;
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function showTypingIndicator() {
  const messagesEl = $('chat-messages');
  if (!messagesEl) return null;

  const div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'message message--ai message--typing';
  div.textContent = 'AI myśli…';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function removeTypingIndicator() {
  const el = $('typing-indicator');
  if (el) el.remove();
}

function updateTokenDisplay(tokens) {
  tokenCount = tokens;
  const fill = $('token-bar-fill');
  if (fill) {
    const pct = Math.min((tokens / CONFIG.maxTokens) * 100, 100);
    fill.style.width = `${pct}%`;
  }
  const counter = $('token-counter');
  if (counter) counter.textContent = `${tokens} / ${CONFIG.maxTokens} tokenów`;
}

function setSendDisabled(disabled) {
  const btn = $('send-btn');
  if (btn) btn.disabled = disabled;
}

/* ── API call ─────────────────────────────────────────────────────── */
async function sendToAPI(messages) {
  const response = await fetch(CONFIG.apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/* ── Main send handler ────────────────────────────────────────────── */
async function handleSend() {
  const inputEl = $('chat-input');
  if (!inputEl || isStreaming) return;

  const userText = inputEl.value.trim();
  if (!userText) return;

  inputEl.value = '';
  inputEl.style.height = 'auto';
  isStreaming = true;
  setSendDisabled(true);

  appendMessage('user', userText);

  conversationHistory.push({ role: 'user', content: userText });
  if (conversationHistory.length > CONFIG.historyLimit * 2) {
    conversationHistory = conversationHistory.slice(-CONFIG.historyLimit * 2);
  }

  const systemPrompt = {
    role: 'system',
    content: 'Jesteś pomocnym asystentem AI o nazwie UltraChat. Odpowiadaj po polsku, chyba że użytkownik pisze w innym języku.',
  };

  showTypingIndicator();

  try {
    const data = await sendToAPI([systemPrompt, ...conversationHistory]);
    const aiContent = data.choices?.[0]?.message?.content || '(brak odpowiedzi)';

    conversationHistory.push({ role: 'assistant', content: aiContent });
    removeTypingIndicator();
    appendMessage('assistant', aiContent);
    updateTokenDisplay(data.usage?.total_tokens ?? tokenCount + userText.length / 4);
  } catch (err) {
    removeTypingIndicator();
    appendMessage('assistant', `❌ Błąd: ${err.message}`);
  } finally {
    isStreaming = false;
    setSendDisabled(false);
  }
}

/* ── Clear conversation ───────────────────────────────────────────── */
function clearConversation() {
  conversationHistory = [];
  tokenCount = 0;
  updateTokenDisplay(0);
  const messagesEl = $('chat-messages');
  if (messagesEl) messagesEl.innerHTML = '';
  appendMessage('assistant', 'Rozmowa wyczyszczona. Jak mogę Ci pomóc?');
}

/* ── Model selection ──────────────────────────────────────────────── */
function onModelChange(event) {
  selectedModel = event.target.value;
}

/* ── Auto-resize textarea ─────────────────────────────────────────── */
function autoResizeInput(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

/* ── PWA service worker registration ─────────────────────────────── */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.warn('SW registration failed:', err));
  }
}

/* ── Initialisation ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();

  const inputEl = $('chat-input');
  const sendBtn = $('send-btn');
  const clearBtn = $('clear-btn');
  const modelSel = $('model-select');

  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    inputEl.addEventListener('input', () => autoResizeInput(inputEl));
  }

  if (sendBtn) sendBtn.addEventListener('click', handleSend);
  if (clearBtn) clearBtn.addEventListener('click', clearConversation);
  if (modelSel) modelSel.addEventListener('change', onModelChange);

  appendMessage('assistant', 'Cześć! Jestem UltraChat AI Omega. Jak mogę Ci dzisiaj pomóc?');
});

/* ── Exports (for testing / other modules) ────────────────────────── */
if (typeof module !== 'undefined') {
  module.exports = { handleSend, clearConversation, CONFIG };
}
