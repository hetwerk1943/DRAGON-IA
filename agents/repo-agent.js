'use strict';
/**
 * Repo Agent – walks the project tree, summarises files and generates
 * lightweight recommendations without external dependencies.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORE = new Set(['node_modules', '.git', 'data', 'logs', '.env']);

function walkDir(dir, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return [];
  const entries = [];
  let items;
  try { items = fs.readdirSync(dir); } catch { return entries; }
  for (const item of items) {
    if (IGNORE.has(item)) continue;
    const full = path.join(dir, item);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      entries.push({ type: 'dir', path: path.relative(ROOT, full) });
      entries.push(...walkDir(full, depth + 1, maxDepth));
    } else {
      entries.push({ type: 'file', path: path.relative(ROOT, full), size: stat.size });
    }
  }
  return entries;
}

function analyseFile(filePath) {
  const recommendations = [];
  let content = '';
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { return recommendations; }

  const rel = path.relative(ROOT, filePath);

  if (rel.endsWith('.js') || rel.endsWith('.mjs')) {
    if (content.includes('eval('))       recommendations.push({ file: rel, level: 'warning', msg: 'Use of eval() detected – potential security risk' });
    if (!content.startsWith("'use strict'") && !content.includes('"use strict"') && !content.includes('import '))
      recommendations.push({ file: rel, level: 'info', msg: 'Consider adding "use strict" directive' });
    if (content.includes('console.log') && !rel.includes('test'))
      recommendations.push({ file: rel, level: 'info', msg: 'console.log found – consider removing debug logs in production' });
  }

  if (rel === 'package.json') {
    try {
      const pkg = JSON.parse(content);
      if (!pkg.scripts || !pkg.scripts.test)
        recommendations.push({ file: rel, level: 'info', msg: 'No test script defined in package.json' });
      if (!pkg.engines)
        recommendations.push({ file: rel, level: 'info', msg: 'Consider adding engines field to package.json' });
    } catch { /* invalid json handled by test-agent */ }
  }

  if ((rel.endsWith('.html')) && !content.includes('meta name="viewport"'))
    recommendations.push({ file: rel, level: 'warning', msg: 'Missing viewport meta tag' });

  return recommendations;
}

async function run() {
  const tree = walkDir(ROOT);
  const files = tree.filter(e => e.type === 'file');
  const dirs  = tree.filter(e => e.type === 'dir');

  const allRecs = [];
  for (const f of files) {
    const recs = analyseFile(path.join(ROOT, f.path));
    allRecs.push(...recs);
  }

  const summary = {
    totalFiles: files.length,
    totalDirs:  dirs.length,
    totalSize:  files.reduce((s, f) => s + f.size, 0),
    extensions: {},
  };
  for (const f of files) {
    const ext = path.extname(f.path) || '(none)';
    summary.extensions[ext] = (summary.extensions[ext] || 0) + 1;
  }

  return {
    agent: 'repo',
    ts: new Date().toISOString(),
    summary,
    tree: tree.slice(0, 200), // cap output size
    recommendations: allRecs,
  };
}

module.exports = { run };
