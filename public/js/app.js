/* DRAGON-IA – Main app (chat UI) */
(function () {
  'use strict';

  // ── Service Worker registration ──────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }

  // ── Offline banner ───────────────────────────────────────────────────────
  const offlineBanner = document.getElementById('offline-banner');
  window.addEventListener('offline', () => { offlineBanner.style.display = 'block'; });
  window.addEventListener('online',  () => { offlineBanner.style.display = 'none'; });

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const chatBox   = document.getElementById('chat-box');
  const msgInput  = document.getElementById('msg-input');
  const sendBtn   = document.getElementById('send-btn');
  const wsStatus  = document.getElementById('ws-status');
  const modelSel  = document.getElementById('model-select');

  // ── Session ──────────────────────────────────────────────────────────────
  const sessionId = 'sess-' + Math.random().toString(36).slice(2);

  // ── WebSocket ────────────────────────────────────────────────────────────
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.addEventListener('open', () => {
    wsStatus.textContent = 'connected';
    wsStatus.style.color = '#3fb950';
  });
  ws.addEventListener('close', () => {
    wsStatus.textContent = 'disconnected';
    wsStatus.style.color = '#f85149';
  });
  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    if (data.type === 'chat' && data.payload && data.payload.sessionId === sessionId) {
      appendMsg('assistant', data.payload.assistantReply);
    }
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function appendMsg(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;
    appendMsg('user', text);
    msgInput.value = '';
    sendBtn.disabled = true;

    if (!navigator.onLine) {
      appendMsg('system', 'Offline – message not sent.');
      sendBtn.disabled = false;
      return;
    }

    // Send via REST (fallback works even if WS is down)
    fetch('/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: text,
        model: modelSel.value,
        role: 'user',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) appendMsg('assistant', data.reply);
        else appendMsg('system', `Error: ${data.error}`);
      })
      .catch((err) => appendMsg('system', `Network error: ${err.message}`))
      .finally(() => { sendBtn.disabled = false; });
  }

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
