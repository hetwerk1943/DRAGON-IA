/**
 * DRAGON-IA Dashboard JS
 * Renders agent statuses, logs, scores and metrics.
 */
(function () {
  "use strict";

  const WS_URL = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host;
  const MAX_LOG_ENTRIES = 200;

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const agentGrid = document.getElementById("agent-grid");
  const logStream = document.getElementById("log-stream");
  const secScore = document.getElementById("sec-score");
  const uptimeEl = document.getElementById("uptime");
  const connEl = document.getElementById("ws-conn-status");
  const reportBtn = document.getElementById("run-sec-scan");
  const repoBtn = document.getElementById("run-repo-scan");
  const exportBtn = document.getElementById("export-report");

  const agentStatus = { repo: "idle", test: "idle", sec: "idle", analytics: "idle", chat: "idle" };
  const agentLabels = { repo: "Repo-Agent", test: "Test-Agent", sec: "Sec-Agent", analytics: "Analytics-Agent", chat: "Chat-Agent" };

  // ── Render agents ──────────────────────────────────────────────────────────
  function renderAgents() {
    if (!agentGrid) return;
    agentGrid.innerHTML = Object.entries(agentLabels).map(([key, label]) => {
      const st = agentStatus[key] || "idle";
      const cls = st === "running" ? "badge-yellow" : "badge-green";
      return `<div class="agent-card" id="agent-card-${key}">
        <div class="agent-name">${label}</div>
        <div class="agent-status"><span class="badge ${cls}">${st}</span></div>
      </div>`;
    }).join("");
  }

  renderAgents();

  // ── Log stream ─────────────────────────────────────────────────────────────
  function appendLog(entry) {
    if (!logStream) return;
    const div = document.createElement("div");
    div.className = "log-entry " + (entry.level || "info");
    div.textContent = `[${entry.ts ? entry.ts.slice(11, 19) : ""}] [${entry.agent || ""}] ${entry.message || ""}`;
    logStream.appendChild(div);
    if (logStream.children.length > MAX_LOG_ENTRIES) logStream.removeChild(logStream.firstChild);
    logStream.scrollTop = logStream.scrollHeight;
  }

  // ── WebSocket ──────────────────────────────────────────────────────────────
  function connectWS() {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      if (connEl) { connEl.textContent = "● connected"; connEl.className = "badge badge-green"; }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.type === "log") appendLog(msg.payload);

        if (msg.type === "status") {
          const info = msg.payload;
          const key = Object.keys(agentLabels).find(k => agentLabels[k] === info.agent);
          if (key) {
            agentStatus[key] = info.status;
            const card = document.getElementById("agent-card-" + key);
            if (card) {
              const cls = info.status === "running" ? "badge-yellow" : "badge-green";
              card.querySelector(".agent-status").innerHTML = `<span class="badge ${cls}">${info.status}</span>`;
            }
          }
        }

        if (msg.type === "finding" && secScore) {
          const score = msg.payload.score;
          secScore.textContent = score;
          secScore.className = "score-ring " + (score >= 80 ? "high" : score >= 50 ? "medium" : "low");
        }
      } catch (_) { /* ignore */ }
    };

    ws.onclose = () => {
      if (connEl) { connEl.textContent = "● disconnected"; connEl.className = "badge badge-red"; }
      setTimeout(connectWS, 3000);
    };

    ws.onerror = () => ws.close();
  }

  connectWS();

  // ── Fetch initial data ─────────────────────────────────────────────────────
  fetch("/api/agents")
    .then(r => r.json())
    .then(data => {
      for (const [key, agent] of Object.entries(data)) {
        if (agentStatus[key] !== undefined) {
          agentStatus[key] = agent.status || "idle";
        }
      }
      renderAgents();
    })
    .catch(() => { /* offline */ });

  fetch("/api/analytics")
    .then(r => r.json())
    .then(data => { if (uptimeEl) uptimeEl.textContent = data.uptime + "s"; })
    .catch(() => { /* offline */ });

  // ── Buttons ────────────────────────────────────────────────────────────────
  if (reportBtn) {
    reportBtn.addEventListener("click", () => {
      fetch("/api/sec/scan-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: document.documentElement.outerHTML, label: "dashboard" })
      })
        .then(r => r.json())
        .then(f => { if (secScore) { secScore.textContent = f.score; secScore.className = "score-ring " + (f.score >= 80 ? "high" : f.score >= 50 ? "medium" : "low"); } })
        .catch(() => { /* offline */ });
    });
  }

  if (repoBtn) {
    repoBtn.addEventListener("click", () => {
      fetch("/api/repo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "dragon-ia", env: "production", files: [] })
      })
        .then(r => r.json())
        .then(report => appendLog({ ts: new Date().toISOString(), level: "info", agent: "Repo-Agent", message: `Score: ${report.score}, Issues: ${report.issues.length}` }))
        .catch(() => { /* offline */ });
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      fetch("/api/agents")
        .then(r => r.json())
        .then(data => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "dragon-ia-report-" + Date.now() + ".json";
          a.click();
          URL.revokeObjectURL(url);
        });
    });
  }

  // ── Uptime ticker ──────────────────────────────────────────────────────────
  let localUptime = 0;
  setInterval(() => {
    localUptime++;
    if (uptimeEl) uptimeEl.textContent = localUptime + "s";
  }, 1000);
})();
