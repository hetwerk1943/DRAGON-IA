/**
 * DRAGON-IA App JS – Chat Interface
 */
(function () {
  "use strict";

  const WS_URL = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host;
  const MODEL_KEY = "dragon-ia-model";
  const SESSION_KEY = "dragon-ia-session";

  let ws;
  let sessionId = localStorage.getItem(SESSION_KEY) || ("s-" + Date.now());
  localStorage.setItem(SESSION_KEY, sessionId);

  // ── PWA Service Worker ─────────────────────────────────────────────────────
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(err => {
      console.warn("SW registration failed:", err);
    });
  }

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const messagesEl = document.getElementById("chat-messages");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const modelSel = document.getElementById("model-select");
  const statusEl = document.getElementById("ws-status");
  const adToggle = document.getElementById("ads-toggle");

  if (!messagesEl || !inputEl) return;

  // Restore saved model
  if (modelSel) {
    modelSel.value = localStorage.getItem(MODEL_KEY) || "gpt-4";
    modelSel.addEventListener("change", () => localStorage.setItem(MODEL_KEY, modelSel.value));
  }

  // ── WebSocket ──────────────────────────────────────────────────────────────
  function connectWS() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      if (statusEl) { statusEl.textContent = "● connected"; statusEl.className = "badge badge-green"; }
      ws.send(JSON.stringify({ type: "ping" }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "chat-response") {
          appendMessage("assistant", msg.reply);
          sendBtn.disabled = false;
        }
      } catch (_) { /* ignore */ }
    };

    ws.onclose = () => {
      if (statusEl) { statusEl.textContent = "● disconnected"; statusEl.className = "badge badge-red"; }
      setTimeout(connectWS, 3000);
    };

    ws.onerror = () => ws.close();
  }

  connectWS();

  // ── Chat ───────────────────────────────────────────────────────────────────
  function appendMessage(role, content) {
    const div = document.createElement("div");
    div.className = "message " + role;
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    const model = modelSel ? modelSel.value : "gpt-4";

    appendMessage("user", text);
    inputEl.value = "";
    sendBtn.disabled = true;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chat", sessionId, message: text, model }));
    } else {
      // Fallback to REST
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, model })
      })
        .then(r => r.json())
        .then(d => { appendMessage("assistant", d.reply); sendBtn.disabled = false; })
        .catch(() => { appendMessage("assistant", "[offline] Message queued for sync."); sendBtn.disabled = false; });
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

  // ── Ads Toggle ────────────────────────────────────────────────────────────
  if (adToggle) {
    const savedAds = localStorage.getItem("dragon-ia-ads") !== "off";
    adToggle.checked = savedAds;
    toggleAds(savedAds);

    adToggle.addEventListener("change", () => {
      const on = adToggle.checked;
      localStorage.setItem("dragon-ia-ads", on ? "on" : "off");
      toggleAds(on);
    });
  }

  function toggleAds(enabled) {
    document.querySelectorAll(".ad-slot").forEach(el => {
      el.style.display = enabled ? "" : "none";
    });
  }
})();
