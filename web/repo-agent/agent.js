/**
 * agent.js – Repo Agent logic
 *
 * Searches GitHub repositories via the public GitHub Search API and
 * renders results as cards in the #result-area element.
 */

const GITHUB_SEARCH_URL = 'https://api.github.com/search/repositories';

const repoInput = document.getElementById('repo-input');
const searchBtn = document.getElementById('search-btn');
const resultArea = document.getElementById('result-area');
const statusEl = document.getElementById('status');

/** Show a temporary status message. */
function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError
    ? 'var(--danger, #f85149)'
    : 'var(--text-secondary, #8b949e)';
}

/** Clear the status message. */
function clearStatus() {
  statusEl.textContent = '';
}

/**
 * Search GitHub for repositories matching the query.
 * @param {string} query
 * @returns {Promise<Object[]>} Array of repository objects
 */
async function searchRepos(query) {
  const url = `${GITHUB_SEARCH_URL}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`;
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (response.status === 403) {
    throw new Error('Przekroczono limit zapytań GitHub API. Spróbuj za chwilę.');
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

/** Format large numbers (e.g. 12500 → "12.5k"). */
function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/**
 * Render a list of repository objects as cards.
 * @param {Object[]} repos
 */
function renderRepos(repos) {
  if (repos.length === 0) {
    resultArea.innerHTML = '<p style="color:var(--text-secondary)">Brak wyników dla tego zapytania.</p>';
    return;
  }

  resultArea.innerHTML = repos
    .map(
      (repo) => `
    <div class="repo-card">
      <h3><a href="${repo.html_url}" target="_blank" rel="noopener">${escapeHtml(repo.full_name)}</a></h3>
      <p>${repo.description ? escapeHtml(repo.description) : '<em>Brak opisu.</em>'}</p>
      <div class="repo-meta">
        <span>⭐ ${formatNum(repo.stargazers_count)}</span>
        <span>🍴 ${formatNum(repo.forks_count)}</span>
        ${repo.language ? `<span>💻 ${escapeHtml(repo.language)}</span>` : ''}
        <span>📅 ${new Date(repo.updated_at).toLocaleDateString('pl-PL')}</span>
      </div>
    </div>
  `
    )
    .join('');
}

/** Minimal HTML escaping. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Main search handler. */
async function handleSearch() {
  const query = repoInput.value.trim();
  if (!query) {
    setStatus('Wpisz zapytanie, aby wyszukać repozytoria.', true);
    return;
  }

  searchBtn.disabled = true;
  resultArea.innerHTML = '<p style="color:var(--text-secondary)">⏳ Szukam…</p>';
  clearStatus();

  try {
    const repos = await searchRepos(query);
    renderRepos(repos);
    setStatus(`Znaleziono ${repos.length} repozytori${repos.length === 1 ? 'um' : 'ów'}.`);
  } catch (err) {
    resultArea.innerHTML = `<p style="color:var(--danger, #f85149)">❌ ${escapeHtml(err.message)}</p>`;
    setStatus(err.message, true);
  } finally {
    searchBtn.disabled = false;
  }
}

/* ── Event listeners ───────────────────────────────────────────────────── */
searchBtn.addEventListener('click', handleSearch);

repoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});
