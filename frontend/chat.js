/* -----------------------------------------------------------------
   UltraChat AI – chat.js
   Features: multi-turn history, TTS, STT, file upload (Vision),
   slash commands, gamification (XP/badges), themes, offline, PWA
----------------------------------------------------------------- */

const API = {
  base:         'http://localhost:3000',
  chat:         '/chat',
  image:        '/image',
  upload:       '/upload',
  translate:    '/translate',
  lint:         '/lint',
  fixCode:      '/fix-code',
  generateDocs: '/generate-docs',
  analyze:      '/analyze',
  config:       '/config',
};

const BADGE_DEFS = [
  { id: 'first',    label: '🌱 Pierwsze kroki',   xp: 10  },
  { id: 'talkative',label: '💬 Gaduła',            xp: 100 },
  { id: 'creator',  label: '🎨 Twórca obrazów',    xp: 200 },
  { id: 'expert',   label: '🏆 Ekspert AI',        xp: 500 },
];

const PERSONA_LABELS = {
  default:    '🤖 Domyślny',
  formal:     '💼 Formalny',
  humorous:   '😄 Humorystyczny',
  poetic:     '🎭 Poetycki',
  futuristic: '🚀 Futurystyczny',
};

// ── State ─────────────────────────────────────────────────────────
let history  = [];
let persona  = 'default';
let ttsOn    = false;
let xp       = 0;
let badges   = [];
let config   = { adsenseEnabled: false, model: 'gpt-4o-mini', personas: ['default'] };
let recognition = null;

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadPersisted();
  await loadConfig();
  applyAdSenseMode();
  renderHistory();
  registerSW();
  setupOffline();
  bindEvents();
  updateXPDisplay();
});

// ── Persistence ───────────────────────────────────────────────────
function loadPersisted() {
  try {
    history = JSON.parse(localStorage.getItem('uc_history') || '[]');
    xp      = parseInt(localStorage.getItem('uc_xp')      || '0', 10);
    badges  = JSON.parse(localStorage.getItem('uc_badges') || '[]');
    persona = localStorage.getItem('uc_persona')            || 'default';
    const theme = localStorage.getItem('uc_theme')          || 'dark';
    document.body.className = `theme-${theme}`;
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  } catch { /* ignore */ }
}

function persist() {
  localStorage.setItem('uc_history', JSON.stringify(history));
  localStorage.setItem('uc_xp',      String(xp));
  localStorage.setItem('uc_badges',  JSON.stringify(badges));
}

// ── Config ────────────────────────────────────────────────────────
async function loadConfig() {
  try {
    const r = await fetch(API.base + API.config);
    if (r.ok) config = await r.json();
  } catch { /* use defaults */ }
  // Populate persona selector
  const sel = document.getElementById('persona-select');
  if (!sel) return;
  sel.innerHTML = '';
  for (const p of (config.personas || ['default'])) {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = PERSONA_LABELS[p] || p;
    sel.appendChild(opt);
  }
  sel.value = persona;
}

// ── Events ────────────────────────────────────────────────────────
function bindEvents() {
  document.getElementById('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = document.getElementById('userInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    handleInput(txt);
  });

  document.getElementById('userInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('chat-form').dispatchEvent(new Event('submit'));
    }
  });

  document.getElementById('theme-toggle') .addEventListener('click', toggleTheme);
  document.getElementById('clear-btn')    .addEventListener('click', confirmClear);
  document.getElementById('tts-btn')      .addEventListener('click', toggleTTS);
  document.getElementById('mic-btn')      .addEventListener('click', toggleSTT);
  document.getElementById('rollback-btn') .addEventListener('click', () => rollback(1));

  document.getElementById('upload-btn').addEventListener('click', () =>
    document.getElementById('file-input').click()
  );
  document.getElementById('file-input').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) { handleFileUpload(f); e.target.value = ''; }
  });

  const personaSel = document.getElementById('persona-select');
  if (personaSel) personaSel.addEventListener('change', e => {
    persona = e.target.value;
    localStorage.setItem('uc_persona', persona);
  });
}

// ── Message routing ───────────────────────────────────────────────
async function handleInput(text) {
  addBubble('user', text);
  if (text.startsWith('/')) { await runCommand(text); return; }
  await doChat(text);
}

// ── Chat ──────────────────────────────────────────────────────────
async function doChat(text) {
  const typing = showTyping();
  setSending(true);
  try {
    const r = await fetch(API.base + API.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history.slice(-20), persona }),
    });
    removeTyping(typing);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      addBubble('error', '❌ ' + (e.error || 'Błąd serwera'));
      return;
    }
    const data  = await r.json();
    const reply = data.choices?.[0]?.message?.content || 'Brak odpowiedzi';
    addBubble('ai', reply);
    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: reply });
    persist();
    earnXP(10);
    if (ttsOn) speakText(reply);
  } catch {
    removeTyping(typing);
    addBubble('error', '❌ Brak połączenia z serwerem. Tryb offline.');
  } finally { setSending(false); }
}

// ── Slash commands ────────────────────────────────────────────────
async function runCommand(text) {
  const [rawCmd, ...parts] = text.slice(1).split(' ');
  const cmd = rawCmd.toLowerCase();
  const arg = parts.join(' ').trim();

  switch (cmd) {
    case 'image':
      if (!arg) { addBubble('info', '💡 Użycie: /image <opis>'); return; }
      await cmdImage(arg); break;

    case 'translate': {
      if (!arg) { addBubble('info', '💡 Użycie: /translate <tekst> [lang:XX]'); return; }
      const m = arg.match(/lang:(\w+)\s*$/i);
      const lang = m ? m[1] : 'en';
      const txt  = m ? arg.slice(0, m.index).trim() : arg;
      await callEndpoint(API.translate, { text: txt, targetLang: lang },
        d => `🌐 **Tłumaczenie (${lang}):**\n${d.translation}`);
      break;
    }

    case 'lint': {
      const parsed = parseCodeBlock(arg);
      await callEndpoint(API.lint, parsed,
        d => `🔍 **Lint (${parsed.language}):**\n${d.result}`, 15);
      break;
    }

    case 'fix': {
      const parsed = parseCodeBlock(arg);
      await callEndpoint(API.fixCode, parsed,
        d => `🔧 **Naprawiony kod (${parsed.language}):**\n\`\`\`${parsed.language}\n${d.fixed}\n\`\`\`\n\n${d.explanation}`, 15);
      break;
    }

    case 'docs':
      if (!arg) { addBubble('info', '💡 Użycie: /docs <opis projektu> [type:readme|changelog|api]'); return; }
      {
        const tm = arg.match(/type:(\w+)\s*$/i);
        const type = tm ? tm[1] : 'readme';
        const desc = tm ? arg.slice(0, tm.index).trim() : arg;
        await callEndpoint(API.generateDocs, { description: desc, type },
          d => `📄 **Wygenerowana dokumentacja:**\n${d.docs}`, 20);
      }
      break;

    case 'analyze':
      if (!arg) { addBubble('info', '💡 Użycie: /analyze <kod lub opis>'); return; }
      await callEndpoint(API.analyze, { context: arg },
        d => `🔮 **Analiza proaktywna:**\n${d.suggestions}`, 10);
      break;

    case 'rollback':
      rollback(parseInt(arg) || 1); break;

    case 'clear':
      confirmClear(); break;

    case 'help':
      showHelp(); break;

    default:
      addBubble('info', `❓ Nieznana komenda: /${cmd}. Wpisz /help.`);
  }
}

// Generic endpoint caller
async function callEndpoint(path, body, formatter, xpAward = 5) {
  const typing = showTyping();
  setSending(true);
  try {
    const r = await fetch(API.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    removeTyping(typing);
    if (!r.ok) { const e = await r.json().catch(() => ({})); addBubble('error', '❌ ' + (e.error || 'Błąd')); return; }
    const data = await r.json();
    addBubble('ai', formatter(data));
    earnXP(xpAward);
  } catch { removeTyping(typing); addBubble('error', '❌ Brak połączenia.'); }
  finally { setSending(false); }
}

// ── Command: /image ───────────────────────────────────────────────
async function cmdImage(prompt) {
  const typing = showTyping();
  setSending(true);
  try {
    const r = await fetch(API.base + API.image, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    removeTyping(typing);
    if (!r.ok) { addBubble('error', '❌ Błąd generowania obrazu'); return; }
    const data = await r.json();
    if (data.url) { addImageBubble(data.url, prompt); earnXP(25); }
    else addBubble('error', '❌ Brak URL obrazu');
  } catch { removeTyping(typing); addBubble('error', '❌ Brak połączenia.'); }
  finally { setSending(false); }
}

// ── File upload ───────────────────────────────────────────────────
async function handleFileUpload(file) {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED.includes(file.type)) { addBubble('error', '❌ Dozwolone: JPG, PNG, GIF, WebP'); return; }
  if (file.size > 4 * 1024 * 1024) { addBubble('error', '❌ Maks. rozmiar: 4 MB'); return; }
  addBubble('info', `📎 Analizuję obraz: ${file.name}…`);
  const b64 = await toBase64(file);
  await callEndpoint(API.upload, { imageBase64: b64, mimeType: file.type },
    d => `🖼️ **Analiza obrazu:**\n${d.description}`, 20);
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function parseCodeBlock(arg) {
  const m = arg.match(/^```(\w+)\n([\s\S]+?)```?$/);
  if (m) return { language: m[1], code: m[2] };
  return { language: 'javascript', code: arg };
}

// ── Help ──────────────────────────────────────────────────────────
function showHelp() {
  addBubble('info', `📋 **Dostępne komendy:**

/image <opis>              – generuj obraz (DALL·E 3)
/translate <tekst> [lang:XX]  – tłumacz tekst
/lint \`\`\`lang\\nkod\`\`\`         – sprawdź kod
/fix \`\`\`lang\\nkod\`\`\`          – napraw kod
/docs <opis> [type:readme]  – generuj dokumentację
/analyze <kontekst>         – proaktywna analiza
/rollback [n]               – cofnij n ostatnich wymian
/clear                      – wyczyść historię
/help                       – ta pomoc

🎙️ Przyciski: mikrofon (STT) | głośnik (TTS) | 📎 obraz | ↩️ cofnij`);
}

// ── DOM helpers ───────────────────────────────────────────────────
function addBubble(role, text) {
  const wrap = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = `message ${role}`;

  const lbl = document.createElement('div');
  lbl.className = 'msg-label';
  lbl.textContent = role === 'user' ? '👤 Ty' : role === 'error' ? '⚠️ Błąd' : role === 'info' ? 'ℹ️ Info' : '🤖 AI';
  div.appendChild(lbl);

  const cnt = document.createElement('div');
  cnt.innerHTML = renderMarkdown(text);
  div.appendChild(cnt);

  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function addImageBubble(url, alt) {
  const wrap = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'message ai';

  const lbl = document.createElement('div');
  lbl.className = 'msg-label';
  lbl.textContent = '🤖 AI (Obraz)';

  const img = document.createElement('img');
  img.src = url; img.alt = alt; img.loading = 'lazy';

  div.appendChild(lbl); div.appendChild(img);
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function renderMarkdown(txt) {
  return txt
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function showTyping() {
  const wrap = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
  return el;
}
function removeTyping(el) { el?.parentNode?.removeChild(el); }
function setSending(v) { document.getElementById('send-btn').disabled = v; }

// ── History management ────────────────────────────────────────────
function renderHistory() {
  const wrap = document.getElementById('chat-messages');
  wrap.innerHTML = '';
  for (let i = 0; i < history.length; i += 2) {
    if (history[i])   addBubble('user', history[i].content);
    if (history[i+1]) addBubble('ai',   history[i+1].content);
  }
  if (!history.length) addBubble('info', '👋 Cześć! Jestem UltraChat AI. Napisz coś lub wpisz `/help`.');
}

function confirmClear() {
  if (!confirm('Wyczyścić całą historię czatu?')) return;
  history = [];
  persist();
  renderHistory();
}

function rollback(n = 1) {
  const count = Math.min(n * 2, history.length);
  history.splice(history.length - count, count);
  persist();
  renderHistory();
  addBubble('info', `↩️ Cofnięto ${n} wymian${n === 1 ? 'ę' : 'y'}.`);
}

// ── TTS ───────────────────────────────────────────────────────────
function toggleTTS() {
  ttsOn = !ttsOn;
  document.getElementById('tts-btn').classList.toggle('active', ttsOn);
  if (!ttsOn) speechSynthesis?.cancel();
}
function speakText(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const tmp = document.createElement('div');
  tmp.innerHTML = text;
  const plain = (tmp.textContent || tmp.innerText || '').slice(0, 600);
  const u = new SpeechSynthesisUtterance(plain);
  u.lang = 'pl-PL';
  speechSynthesis.speak(u);
}

// ── STT ───────────────────────────────────────────────────────────
function toggleSTT() {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    addBubble('info', '🎙️ Twoja przeglądarka nie obsługuje STT.'); return;
  }
  if (recognition) { recognition.stop(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'pl-PL';
  recognition.interimResults = false;
  document.getElementById('mic-btn').classList.add('listening');
  recognition.onresult = e => {
    const txt = e.results[0][0].transcript;
    handleInput(txt);
  };
  recognition.onend = recognition.onerror = stopSTT;
  recognition.start();
}
function stopSTT() {
  recognition = null;
  document.getElementById('mic-btn')?.classList.remove('listening');
}

// ── Theme ─────────────────────────────────────────────────────────
function toggleTheme() {
  const light = document.body.classList.contains('theme-light');
  const next = light ? 'dark' : 'light';
  document.body.className = `theme-${next}`;
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('uc_theme', next);
}

// ── AdSense ───────────────────────────────────────────────────────
function applyAdSenseMode() {
  const show = config.adsenseEnabled;
  ['ad-top', 'ad-middle', 'ad-bottom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  });
}

// ── Gamification ──────────────────────────────────────────────────
function earnXP(amount) {
  xp += amount;
  persist();
  updateXPDisplay();
  checkBadges();
}
function updateXPDisplay() {
  const el = document.getElementById('xp-display');
  if (el) el.textContent = `✨ ${xp} XP`;
}
function checkBadges() {
  for (const b of BADGE_DEFS) {
    if (xp >= b.xp && !badges.includes(b.id)) {
      badges.push(b.id);
      persist();
      addBubble('info', `🎖️ Odznaka odblokowana: ${b.label}`);
    }
  }
}

// ── PWA / Service Worker ──────────────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ── Offline ───────────────────────────────────────────────────────
function setupOffline() {
  const badge = document.getElementById('offline-badge');
  const update = () => { if (badge) badge.hidden = navigator.onLine; };
  window.addEventListener('online',  update);
  window.addEventListener('offline', update);
  update();
}
