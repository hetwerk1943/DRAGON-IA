/* agent.js – DragonAI AI Agent module */
'use strict';

/**
 * Sends a message to the backend AI agent and returns the assistant reply.
 * @param {string} userMessage
 * @param {Array<{role:string, content:string}>} history
 * @returns {Promise<string>}
 */
async function askAgent(userMessage, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.reply ?? '';
}

export { askAgent };
