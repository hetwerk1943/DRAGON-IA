'use strict';
/**
 * Security Agent – audits HTML files for security best-practices:
 * CSP headers, SRI, viewport, XSS vectors, CSRF indicators, PWA manifest.
 */
const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const IGNORE = new Set(['node_modules', '.git']);

function findHtmlFiles(dir, results = []) {
  let items;
  try { items = fs.readdirSync(dir); } catch { return results; }
  for (const item of items) {
    if (IGNORE.has(item)) continue;
    const full = path.join(dir, item);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) findHtmlFiles(full, results);
    else if (item.endsWith('.html')) results.push(full);
  }
  return results;
}

function auditHtml(filePath) {
  const rel = path.relative(ROOT, filePath);
  const issues = [];
  const passes = [];
  let content = '';
  try { content = fs.readFileSync(filePath, 'utf8'); } catch {
    return { file: rel, error: 'Cannot read file', issues: [], passes: [] };
  }

  // Viewport
  if (content.includes('name="viewport"')) passes.push('viewport meta present');
  else issues.push({ severity: 'warning', msg: 'Missing <meta name="viewport">' });

  // CSP meta
  if (content.includes('Content-Security-Policy')) passes.push('CSP meta tag present');
  else issues.push({ severity: 'warning', msg: 'No Content-Security-Policy meta tag found' });

  // X-Content-Type-Options hint
  if (content.includes('X-Content-Type-Options')) passes.push('X-Content-Type-Options hint present');
  else issues.push({ severity: 'info', msg: 'Consider adding X-Content-Type-Options meta hint' });

  // SRI on external scripts
  const scriptTags = content.match(/<script[^>]+src=["'][^"']*["'][^>]*>/gi) || [];
  for (const tag of scriptTags) {
    if (tag.includes('http://') || tag.includes('https://')) {
      if (tag.includes('integrity=')) passes.push(`SRI present on: ${tag.slice(0, 80)}`);
      else issues.push({ severity: 'warning', msg: `External script without SRI: ${tag.slice(0, 120)}` });
    }
  }

  // SRI on external links (stylesheets)
  const linkTags = content.match(/<link[^>]+href=["'][^"']*["'][^>]*>/gi) || [];
  for (const tag of linkTags) {
    if ((tag.includes('http://') || tag.includes('https://')) && tag.includes('stylesheet')) {
      if (tag.includes('integrity=')) passes.push(`SRI present on link: ${tag.slice(0, 80)}`);
      else issues.push({ severity: 'info', msg: `External stylesheet without SRI: ${tag.slice(0, 120)}` });
    }
  }

  // Inline event handlers (XSS risk indicator)
  const inlineHandlers = content.match(/\s(onclick|onmouseover|onerror|onload|onsubmit)=/gi) || [];
  if (inlineHandlers.length > 0) {
    issues.push({ severity: 'warning', msg: `Inline event handlers found (${inlineHandlers.length}) – move to addEventListener` });
  }

  // document.write (XSS risk)
  if (content.includes('document.write(')) {
    issues.push({ severity: 'warning', msg: 'document.write() found – XSS risk' });
  }

  // innerHTML without obvious sanitisation
  const innerHtmlCount = (content.match(/\.innerHTML\s*=/g) || []).length;
  if (innerHtmlCount > 0) {
    issues.push({ severity: 'info', msg: `innerHTML assignments found (${innerHtmlCount}) – ensure inputs are sanitised` });
  }

  // PWA manifest link
  if (content.includes('rel="manifest"')) passes.push('PWA manifest linked');
  else issues.push({ severity: 'info', msg: 'No PWA manifest link found' });

  // Service worker registration
  if (content.includes('serviceWorker')) passes.push('Service worker registration present');
  else issues.push({ severity: 'info', msg: 'No service worker registration found' });

  // HTTPS enforced (no http:// resources)
  const httpResources = content.match(/src=["']http:\/\//gi) || [];
  if (httpResources.length > 0) {
    issues.push({ severity: 'warning', msg: `${httpResources.length} resource(s) loaded over HTTP (not HTTPS)` });
  }

  return { file: rel, issues, passes };
}

async function run() {
  const htmlFiles = findHtmlFiles(PUBLIC);
  const audits    = htmlFiles.map(auditHtml);

  const totalIssues  = audits.reduce((s, a) => s + (a.issues || []).length, 0);
  const totalPasses  = audits.reduce((s, a) => s + (a.passes || []).length, 0);
  const warnings     = audits.flatMap(a => (a.issues || []).filter(i => i.severity === 'warning'));
  const score        = totalPasses + totalIssues > 0
    ? Math.round((totalPasses / (totalPasses + totalIssues)) * 100)
    : 100;

  return {
    agent: 'sec',
    ts: new Date().toISOString(),
    score,
    summary: {
      filesAudited: audits.length,
      totalIssues,
      totalPasses,
      warnings: warnings.length,
    },
    audits,
  };
}

module.exports = { run };
