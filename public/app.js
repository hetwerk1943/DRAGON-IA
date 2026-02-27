'use strict';

const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Conversation history sent to the server (excludes system prompt)
const conversationHistory = [];

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.classList.add('message');
  if (role === 'user') {
    div.classList.add('user-msg');
    div.textContent = 'You: ' + text;
  } else if (role === 'assistant') {
    div.classList.add('ai-msg');
    div.textContent = 'AI: ' + text;
  } else {
    div.classList.add('error-msg');
    div.textContent = text;
  }
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userText = userInput.value.trim();
  if (!userText) return;

  userInput.value = '';
  sendBtn.disabled = true;

  appendMessage('user', userText);
  conversationHistory.push({ role: 'user', content: userText });

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Server error.');
    }

    const data = await res.json();
    const reply = typeof data.reply === 'string' ? data.reply : null;

    if (!reply) {
      throw new Error('Unexpected response from server.');
    }

    conversationHistory.push({ role: 'assistant', content: reply });
    appendMessage('assistant', reply);
  } catch (err) {
    appendMessage('error', 'Error: ' + err.message);
    // Remove last user message from history on error
    conversationHistory.pop();
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
