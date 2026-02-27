/* DRAGON-IA Dashboard – client-side logic */
'use strict';

(function () {
  // ── Socket.io connection ──────────────────────────────────────────────────
  const socket = io();
  const wsDot = document.getElementById('ws-dot');
  const wsLabel = document.getElementById('ws-label');

  socket.on('connect', () => {
    wsDot.classList.add('connected');
    wsLabel.textContent = 'Connected';
  });
  socket.on('disconnect', () => {
    wsDot.classList.remove('connected');
    wsDot.classList.add('error');
    wsLabel.textContent = 'Disconnected';
  });

  // ── Agent cards ───────────────────────────────────────────────────────────
  socket.on('agent:list', (agents) => agents.forEach(updateAgentCard));
  socket.on('agent:status', (payload) => {
    const el = document.getElementById(`agent-${payload.agentName}`);
    if (el) {
      const badge = el.querySelector('.status');
      badge.textContent = payload.status;
      badge.className = `status ${payload.status}`;
    }
  });

  function updateAgentCard(agent) {
    const el = document.getElementById(`agent-${agent.name}`);
    if (!el) return;
    el.querySelector('.status').textContent = agent.status;
    el.querySelector('.status').className = `status ${agent.status}`;
    el.querySelector('.last-run').textContent = agent.lastRun ? `Last run: ${new Date(agent.lastRun).toLocaleString()}` : 'Never run';
  }

  // ── Run agent buttons ─────────────────────────────────────────────────────
  document.querySelectorAll('[data-agent-run]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const agent = btn.dataset.agentRun;
      btn.disabled = true;
      try {
        const body = {};
        if (agent === 'repo') {
          const url = document.getElementById('repo-url')?.value.trim();
          if (url) body.repoUrl = url;
        }
        const resp = await fetch(`/api/agents/${agent}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        handleAgentResult(agent, data);
      } catch (err) {
        addEventLog('error', `${agent} run failed: ${err.message}`);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // ── Handle agent results ──────────────────────────────────────────────────
  socket.on('agent:event', ({ agent, type, payload }) => {
    addEventLog(agent, `${type} received`);
    if (agent === 'SecAgent' && type === 'report') renderSecReport(payload);
    if (agent === 'AnalyticsAgent' && type === 'metrics') renderMetrics(payload);
    if (agent === 'TestAgent' && type === 'result') renderTestResult(payload);
    if (agent === 'RepoAgent' && type === 'report') renderRepoReport(payload);
  });

  function handleAgentResult(agent, data) {
    addEventLog(agent, 'result received');
    if (agent === 'sec') renderSecReport(data);
    if (agent === 'analytics') renderMetrics(data);
    if (agent === 'test') renderTestResult(data);
    if (agent === 'repo') renderRepoReport(data);
  }

  // ── Security report ───────────────────────────────────────────────────────
  function renderSecReport(report) {
    const score = report.score || 0;
    const circle = document.getElementById('sec-score');
    if (circle) {
      circle.textContent = score;
      circle.className = 'score-circle' + (score >= 80 ? '' : score >= 50 ? ' warn' : ' danger');
    }
    const list = document.getElementById('findings-list');
    if (list && report.findings) {
      list.innerHTML = report.findings.map(f =>
        `<li><span class="finding-badge badge-${f.severity}">${f.severity}</span>${escHtml(f.message)}</li>`
      ).join('');
    }
  }

  // ── Analytics metrics ─────────────────────────────────────────────────────
  function renderMetrics(m) {
    setValue('metric-requests', m.requestCount);
    setValue('metric-errors', m.errorCount);
    setValue('metric-avg-ms', m.avgResponseMs + 'ms');
    setValue('metric-uptime', formatUptime(m.uptime));
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatUptime(secs) {
    if (!secs) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
  }

  // ── Test results ──────────────────────────────────────────────────────────
  function renderTestResult(result) {
    const el = document.getElementById('test-result');
    if (!el) return;
    const checks = (result.checks || []).map(c =>
      `<li style="color:${c.passed ? 'var(--success)' : 'var(--danger)'}">${c.passed ? '✓' : '✗'} ${escHtml(c.name)}${c.detail ? ` – ${escHtml(c.detail)}` : ''}</li>`
    ).join('');
    el.innerHTML = `<ul style="list-style:none;font-size:0.82rem">${checks}</ul><p style="margin-top:0.5rem;font-size:0.8rem">Passed: ${result.passed} / Failed: ${result.failed}</p>`;
  }

  // ── Repo report ───────────────────────────────────────────────────────────
  function renderRepoReport(report) {
    const el = document.getElementById('repo-result');
    if (!el) return;
    let html = `<p style="font-size:0.82rem;margin-bottom:0.5rem"><strong>Score:</strong> ${report.score}/100</p>`;
    if (report.meta) {
      html += `<p style="font-size:0.82rem">${escHtml(report.meta.fullName)} – ${escHtml(report.meta.language || 'N/A')} · ⭐ ${report.meta.stars}</p>`;
    }
    if (report.issues && report.issues.length) {
      html += `<ul style="font-size:0.8rem;margin-top:0.5rem;list-style:none">${report.issues.map(i => `<li>${escHtml(i.level)}: ${escHtml(i.message)}</li>`).join('')}</ul>`;
    }
    if (report.patches && report.patches.length) {
      html += `<p style="font-size:0.8rem;margin-top:0.5rem;color:var(--info)">Suggested patches: ${report.patches.map(p => escHtml(p.suggestion)).join(', ')}</p>`;
    }
    el.innerHTML = html;
  }

  // ── Event log ─────────────────────────────────────────────────────────────
  function addEventLog(channel, message) {
    const log = document.getElementById('event-log');
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = 'entry';
    const ts = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="ts">${ts}</span><span class="channel">${escHtml(String(channel))}</span>${escHtml(String(message))}`;
    log.prepend(entry);
    // Keep max 100 entries
    while (log.children.length > 100) log.removeChild(log.lastChild);
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const sessionId = 'session-' + Math.random().toString(36).slice(2);

  socket.on('chat:reply', (data) => appendChatMsg('assistant', data.reply));
  socket.on('chat:error', (data) => appendChatMsg('error', data.message));

  if (chatSend) {
    chatSend.addEventListener('click', sendChat);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
  }

  function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendChatMsg('user', msg);
    socket.emit('chat:message', { sessionId, message: msg });
    chatInput.value = '';
  }

  function appendChatMsg(role, content) {
    if (!chatMessages) return;
    const el = document.createElement('div');
    el.className = `chat-msg ${role}`;
    el.innerHTML = `<span class="role">${role === 'user' ? 'You' : role === 'assistant' ? 'DRAGON-IA' : 'Error'}:</span>${escHtml(content)}`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Auto-refresh analytics ─────────────────────────────────────────────────
  async function refreshAnalytics() {
    try {
      const resp = await fetch('/api/agents/analytics');
      if (resp.ok) renderMetrics(await resp.json());
    } catch (_) { /* ignore */ }
  }
  refreshAnalytics();
  setInterval(refreshAnalytics, 15000);

  // ── PWA registration ──────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
