'use strict';

const express = require('express');
const router = express.Router();

module.exports = function createApiRouter(orchestrator) {

  /**
   * GET /api/status – health check and agent statuses.
   */
  router.get('/status', (_req, res) => {
    res.json({ ok: true, statuses: orchestrator.getStatuses(), ts: new Date().toISOString() });
  });

  /**
   * GET /api/dashboard – aggregated dashboard data.
   */
  router.get('/dashboard', (_req, res) => {
    res.json(orchestrator.getDashboard());
  });

  /**
   * GET /api/reports – list stored reports.
   */
  router.get('/reports', (_req, res) => {
    res.json({ reports: orchestrator.getReports() });
  });

  /**
   * POST /api/analyze – run repo + sec + test agents.
   */
  router.post('/analyze', async (req, res) => {
    try {
      const results = await orchestrator.runAll(req.body || {});
      res.json({ ok: true, results });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /**
   * POST /api/repo – run only the Repo-Agent.
   */
  router.post('/repo', async (req, res) => {
    try {
      const report = await orchestrator.agents.repo.analyze(req.body || {});
      res.json({ ok: true, report });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /**
   * POST /api/sec – run only the Sec-Agent.
   */
  router.post('/sec', async (req, res) => {
    try {
      const report = await orchestrator.agents.sec.scan(req.body || {});
      res.json({ ok: true, report });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /**
   * POST /api/test – run only the Test-Agent.
   */
  router.post('/test', async (req, res) => {
    try {
      const report = await orchestrator.agents.test.run(req.body || {});
      res.json({ ok: true, report });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /**
   * POST /api/analytics – record an analytics event.
   */
  router.post('/analytics', (req, res) => {
    const { type = 'event', data = {} } = req.body || {};
    orchestrator.agents.analytics.recordEvent(type, data);
    res.json({ ok: true });
  });

  /**
   * GET /api/analytics/report – get analytics report.
   */
  router.get('/analytics/report', async (req, res) => {
    try {
      const report = await orchestrator.agents.analytics.report({
        adSafeMode: !['false', '0', 'no', 'off'].includes(String(req.query.adSafeMode).toLowerCase()),
      });
      res.json({ ok: true, report });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
};
