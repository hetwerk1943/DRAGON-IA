/**
 * main.js – Chat backend logic + ad ON/OFF toggle
 *
 * Exposes:
 *   - sendMessage(message, history) → Promise<string>
 *   - setAdsEnabled(enabled)
 *   - areAdsEnabled() → boolean
 */

/* ── Ad state ──────────────────────────────────────────────────────────── */
let _adsEnabled = localStorage.getItem('adsEnabled') !== 'false';

/**
 * Enable or disable the ad banner.
 * @param {boolean} enabled
 */
function setAdsEnabled(enabled) {
  _adsEnabled = Boolean(enabled);
  const banner = document.querySelector('.ad-banner');
  if (banner) {
    banner.classList.toggle('hidden', !_adsEnabled);
  }
  localStorage.setItem('adsEnabled', String(_adsEnabled));
}

/**
 * Returns the current ad-enabled state.
 * @returns {boolean}
 */
function areAdsEnabled() {
  return _adsEnabled;
}

/* ── Chat API ───────────────────────────────────────────────────────────── */

/**
 * Send a user message to the backend /api/chat endpoint.
 * Falls back to a mock response when the server is unavailable (offline mode).
 *
 * @param {string} message – The user's message.
 * @param {Array<{role:string, content:string}>} history – Previous messages.
 * @returns {Promise<string>} The assistant's reply.
 */
async function sendMessage(message, history = []) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.message || 'Brak odpowiedzi od serwera.';
  } catch (err) {
    if (!navigator.onLine) {
      return '⚠️ Tryb offline – brak połączenia z serwerem.';
    }
    throw err;
  }
}

/* ── DOM Initialisation ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Apply initial ad preference to the banner element
  const banner = document.querySelector('.ad-banner');
  if (banner) {
    banner.classList.toggle('hidden', !_adsEnabled);
  }

  // Ad close button
  const adClose = document.querySelector('.ad-close');
  if (adClose) {
    adClose.addEventListener('click', () => setAdsEnabled(false));
  }

  // Ad toggle button (optional, if present on the page)
  const adToggle = document.getElementById('ad-toggle');
  if (adToggle) {
    adToggle.addEventListener('click', () => {
      setAdsEnabled(!areAdsEnabled());
      adToggle.textContent = areAdsEnabled() ? 'Wyłącz reklamy' : 'Włącz reklamy';
    });
  }

  /* ── Chat UI ────────────────────────────────────────────────────────── */
  const chatWindow = document.getElementById('chat-window');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (!chatWindow || !userInput || !sendBtn) return;

  let chatHistory = [];

  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.classList.add('message', role);
    div.textContent = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div;
  }

  async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    sendBtn.disabled = true;

    appendMessage('user', text);

    const thinking = appendMessage('assistant', '…');

    try {
      const reply = await sendMessage(text, chatHistory);
      thinking.textContent = reply;
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
      thinking.textContent = `Błąd: ${err.message}`;
      thinking.classList.add('error');
      thinking.classList.remove('assistant');
    } finally {
      sendBtn.disabled = false;
      userInput.focus();
    }
  }

  sendBtn.addEventListener('click', handleSend);

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      chatHistory = [];
      chatWindow.innerHTML = '';
    });
  }

  /* ── PWA Service Worker registration ──────────────────────────────────── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }
});
