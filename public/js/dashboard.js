/* DRAGON-IA – Dashboard JS */
(function () {
  'use strict';

  // ── Service Worker ───────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const agentCards  = document.getElementById('agent-cards');
  const secScore    = document.getElementById('sec-score');
  const repoScore   = document.getElementById('repo-score');
  const uptime      = document.getElementById('uptime');
  const sessions    = document.getElementById('sessions');
  const vulnTable   = document.getElementById('vuln-table');
  const logEl       = document.getElementById('log');
  const wsBadge     = document.getElementById('ws-status-badge');
  const btnRunAll   = document.getElementById('btn-run-all');
  const btnRefresh  = document.getElementById('btn-refresh');
  const adsafeToggle= document.getElementById('adsafe-toggle');

  // ── WebSocket ────────────────────────────────────────────────────────────
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.addEventListener('open', () => {
    wsBadge.textContent = 'WS: connected';
    wsBadge.className = 'badge running';
  });
  ws.addEventListener('close', () => {
    wsBadge.textContent = 'WS: disconnected';
    wsBadge.className = 'badge error';
  });
  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    handleWsMessage(data);
  });

  function handleWsMessage(data) {
    if (data.type === 'connected') {
      renderAgentStatuses(data.statuses);
    }
    if (data.type === 'report') {
      addLog('report', `[${data.payload.agent}] report received`);
      if (data.payload.agent === 'sec-agent' && data.payload.report) {
        renderVulns(data.payload.report.vulnerabilities || []);
        setScore(secScore, data.payload.report.securityScore);
      }
      if (data.payload.agent === 'repo-agent' && data.payload.report) {
        setScore(repoScore, data.payload.report.score);
      }
      if (data.payload.agent === 'analytics-agent' && data.payload.report) {
        uptime.textContent = data.payload.report.uptimeHuman || '—';
      }
    }
    if (data.type === 'chat') {
      addLog('chat', `[chat] session=${data.payload.sessionId} model=${data.payload.model}`);
    }
    if (data.type === 'agent-error') {
      addLog('error', `[error] ${data.payload.agent}: ${data.payload.error}`);
    }
  }

  // ── Render helpers ───────────────────────────────────────────────────────
  function renderAgentStatuses(statusObj) {
    if (!statusObj) return;
    agentCards.innerHTML = '';
    for (const [key, val] of Object.entries(statusObj)) {
      const card = document.createElement('div');
      card.className = 'card';
      const st = val.status || 'idle';
      card.innerHTML = `<h2>${agentIcon(key)} ${key} <span class="badge ${st}">${st}</span></h2>
        <p style="font-size:0.8rem;color:#8b949e;">${key === 'chat' ? `Sessions: ${val.activeSessions || 0}` : ''}</p>`;
      agentCards.appendChild(card);
    }
  }

  function agentIcon(name) {
    const icons = { repo: '📁', test: '🧪', sec: '🔒', analytics: '📊', chat: '💬' };
    return icons[name] || '🤖';
  }

  function setScore(el, value) {
    if (value == null) { el.textContent = '—'; return; }
    el.textContent = value;
    el.className = 'score' + (value >= 80 ? '' : value >= 50 ? ' medium' : ' low');
  }

  function renderVulns(vulns) {
    if (!vulns.length) {
      vulnTable.innerHTML = '<tr><td colspan="3" style="color:#3fb950">✅ No vulnerabilities found.</td></tr>';
      return;
    }
    vulnTable.innerHTML = vulns.map(v =>
      `<tr>
        <td>${v.type || '—'}</td>
        <td class="severity-${v.severity || 'low'}">${v.severity || '—'}</td>
        <td>${escHtml(v.message || '')}</td>
      </tr>`
    ).join('');
  }

  function addLog(type, msg) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  btnRunAll.addEventListener('click', () => {
    addLog('report', 'Dispatching run-all to agents…');
    ws.send(JSON.stringify({ type: 'run-all', payload: { adSafeMode: adsafeToggle.checked } }));
  });

  btnRefresh.addEventListener('click', () => loadDashboard());

  adsafeToggle.addEventListener('change', () => {
    addLog('report', `AdSafe mode: ${adsafeToggle.checked ? 'ON' : 'OFF'}`);
  });

  // ── Initial load ─────────────────────────────────────────────────────────
  function loadDashboard() {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        renderAgentStatuses(data.agentStatuses);
        sessions.textContent = (data.activeSessions || []).length;
        const recentReports = data.recentReports || [];
        for (const r of recentReports.slice(-10)) {
          addLog('report', `[${r.agent}] historical report`);
        }
      })
      .catch(() => addLog('error', 'Failed to load dashboard'));
  }

  loadDashboard();
})();
