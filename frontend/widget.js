/* UltraChat AI – Embeddable Widget
   Usage: <script src="widget.js" data-backend="http://localhost:3000"></script>
   Optional: window.UltraChatWidget = { backendUrl: '...', position: 'bottom-right' }
*/
(function () {
  'use strict';
  const cfg = window.UltraChatWidget || {};
  const BACKEND = cfg.backendUrl
    || document.currentScript?.getAttribute('data-backend')
    || 'http://localhost:3000';
  const POS = cfg.position || 'bottom-right';

  // ── Styles ───────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #uc-fab{position:fixed;${POS.includes('right')?'right:1.5rem;':'left:1.5rem;'}bottom:1.5rem;z-index:99999;
      width:52px;height:52px;border-radius:50%;background:#00d4ff;color:#000;border:none;
      font-size:1.4rem;cursor:pointer;box-shadow:0 4px 16px rgba(0,212,255,.5);
      display:flex;align-items:center;justify-content:center;transition:transform .2s;}
    #uc-fab:hover{transform:scale(1.1);}
    #uc-panel{position:fixed;${POS.includes('right')?'right:1.5rem;':'left:1.5rem;'}bottom:5rem;z-index:99998;
      width:320px;max-height:460px;background:#16213e;border:1px solid rgba(0,212,255,.25);
      border-radius:16px;display:none;flex-direction:column;overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:'Segoe UI',Arial,sans-serif;}
    #uc-panel.open{display:flex;}
    #uc-hdr{background:#0f3460;padding:.6rem .85rem;display:flex;align-items:center;justify-content:space-between;}
    #uc-hdr span{color:#00d4ff;font-size:.9rem;font-weight:700;}
    #uc-close{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1rem;padding:.2rem;}
    #uc-msgs{flex:1;overflow-y:auto;padding:.75rem;display:flex;flex-direction:column;gap:.4rem;}
    #uc-msgs::-webkit-scrollbar{width:4px;}
    #uc-msgs::-webkit-scrollbar-thumb{background:rgba(0,212,255,.2);border-radius:999px;}
    .uc-msg{max-width:88%;padding:.4rem .65rem;border-radius:10px;font-size:.82rem;line-height:1.45;word-break:break-word;}
    .uc-user{background:#0f3460;align-self:flex-end;color:#e2e8f0;}
    .uc-ai{background:#0d2137;border-left:2px solid #00d4ff;align-self:flex-start;color:#e2e8f0;}
    .uc-err{background:rgba(255,107,107,.15);border-left:2px solid #ff6b6b;align-self:flex-start;color:#ff6b6b;font-size:.78rem;}
    #uc-form{display:flex;gap:.4rem;padding:.5rem .75rem;border-top:1px solid rgba(0,212,255,.15);background:#16213e;}
    #uc-inp{flex:1;background:#0f3460;color:#e2e8f0;border:1px solid rgba(0,212,255,.2);
      border-radius:8px;padding:.4rem .6rem;font-size:.82rem;font-family:inherit;resize:none;}
    #uc-inp:focus{outline:none;border-color:#00d4ff;}
    #uc-send{background:#00d4ff;color:#000;border:none;border-radius:8px;padding:.4rem .7rem;
      font-weight:700;cursor:pointer;font-size:.82rem;}
    #uc-send:disabled{opacity:.4;cursor:not-allowed;}
  `;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────
  const fab   = document.createElement('button');
  fab.id = 'uc-fab'; fab.title = 'Otwórz UltraChat AI'; fab.textContent = '🤖';

  const panel = document.createElement('div'); panel.id = 'uc-panel';
  panel.innerHTML = `
    <div id="uc-hdr"><span>🤖 UltraChat AI</span><button id="uc-close" title="Zamknij">✕</button></div>
    <div id="uc-msgs"></div>
    <form id="uc-form" autocomplete="off">
      <textarea id="uc-inp" rows="1" placeholder="Napisz…"></textarea>
      <button type="submit" id="uc-send">➤</button>
    </form>`;

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  // ── Logic ─────────────────────────────────────────────────
  const msgs = () => document.getElementById('uc-msgs');
  let widgetHistory = [];

  function addMsg(role, text) {
    const d = document.createElement('div');
    d.className = `uc-msg uc-${role}`;
    d.textContent = text;
    msgs().appendChild(d);
    msgs().scrollTop = msgs().scrollHeight;
  }

  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !widgetHistory.length) {
      addMsg('ai', '👋 Cześć! Jak mogę pomóc?');
    }
  });
  document.getElementById('uc-close').addEventListener('click', () => panel.classList.remove('open'));

  document.getElementById('uc-form').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = document.getElementById('uc-inp');
    const send = document.getElementById('uc-send');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    addMsg('user', text);
    send.disabled = true;
    try {
      const r = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: widgetHistory.slice(-10) }),
      });
      if (!r.ok) { addMsg('err', 'Błąd serwera.'); return; }
      const data  = await r.json();
      const reply = data.choices?.[0]?.message?.content || 'Brak odpowiedzi';
      addMsg('ai', reply);
      widgetHistory.push({ role: 'user', content: text });
      widgetHistory.push({ role: 'assistant', content: reply });
    } catch { addMsg('err', 'Brak połączenia z serwerem.'); }
    finally { send.disabled = false; }
  });

  document.getElementById('uc-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('uc-form').dispatchEvent(new Event('submit'));
    }
  });
})();
