'use strict';
/**
 * RepoAgent – analyses a GitHub repository, generates a summary report
 * and proposes basic patch suggestions based on found issues.
 */
const BaseAgent = require('./BaseAgent');

class RepoAgent extends BaseAgent {
  constructor() {
    super('RepoAgent');
  }

  async _execute({ repoUrl, token } = {}) {
    const report = {
      repoUrl: repoUrl || null,
      analysedAt: new Date().toISOString(),
      issues: [],
      patches: [],
      score: 100,
    };

    if (!repoUrl) {
      report.issues.push({ level: 'warn', message: 'No repoUrl provided – skipping remote analysis.' });
      report.score = 0;
      return report;
    }

    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (!match) {
      report.issues.push({ level: 'error', message: 'Cannot parse GitHub repo URL.' });
      report.score = 0;
      return report;
    }
    const [, owner, repo] = match;

    try {
      const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'DRAGON-IA' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fetch = (await import('node-fetch')).default;

      // Fetch repo metadata
      const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoResp.ok) throw new Error(`GitHub API error: ${repoResp.status}`);
      const repoData = await repoResp.json();

      report.meta = {
        fullName: repoData.full_name,
        description: repoData.description,
        defaultBranch: repoData.default_branch,
        stars: repoData.stargazers_count,
        openIssues: repoData.open_issues_count,
        license: repoData.license ? repoData.license.spdx_id : 'NONE',
        language: repoData.language,
      };

      // Scoring heuristics
      if (!repoData.license) { report.score -= 10; report.issues.push({ level: 'warn', message: 'No license detected.' }); }
      if (!repoData.description) { report.score -= 5; report.issues.push({ level: 'info', message: 'Repository has no description.' }); }
      if (repoData.open_issues_count > 50) { report.score -= 10; report.issues.push({ level: 'warn', message: `High open issue count: ${repoData.open_issues_count}` }); }

      // Suggest patches for missing items
      if (!repoData.license) report.patches.push({ type: 'add_file', path: 'LICENSE', suggestion: 'Add an OSI-approved license.' });

    } catch (err) {
      report.issues.push({ level: 'error', message: err.message });
      report.score = Math.max(0, report.score - 20);
    }

    this._emit('report', report);
    return report;
  }
}

module.exports = new RepoAgent();
