'use strict';
const repoAgent = require('./repo-agent');
const testAgent = require('./test-agent');
const secAgent  = require('./sec-agent');

let broadcastFn = () => {};

const state = {
  lastRunId: null,
  running: false,
  results: {},
  startedAt: null,
  finishedAt: null,
};

function setBroadcast(fn) {
  broadcastFn = fn;
}

function getStatus() {
  return { ...state };
}

async function run(agentNames = ['repo', 'test', 'sec'], runId) {
  state.lastRunId  = runId;
  state.running    = true;
  state.startedAt  = new Date().toISOString();
  state.finishedAt = null;
  state.results    = {};

  broadcastFn({ type: 'agents:start', runId, agents: agentNames });

  const map = { repo: repoAgent, test: testAgent, sec: secAgent };

  for (const name of agentNames) {
    const agent = map[name];
    if (!agent) {
      state.results[name] = { error: `Unknown agent: ${name}` };
      continue;
    }
    broadcastFn({ type: 'agents:agent:start', runId, agent: name });
    try {
      const result = await agent.run();
      state.results[name] = result;
      broadcastFn({ type: 'agents:agent:done', runId, agent: name, result });
    } catch (err) {
      const errResult = { error: err.message };
      state.results[name] = errResult;
      broadcastFn({ type: 'agents:agent:error', runId, agent: name, error: err.message });
    }
  }

  state.running    = false;
  state.finishedAt = new Date().toISOString();
  broadcastFn({ type: 'agents:done', runId, results: state.results });
}

module.exports = { setBroadcast, getStatus, run };
