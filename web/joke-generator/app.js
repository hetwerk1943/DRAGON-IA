/**
 * app.js – Joke Generator logic
 *
 * Fetches a random joke from the Official Joke API and renders it
 * as a two-step reveal (setup → punchline).
 */

const JOKE_API_URL = 'https://official-joke-api.appspot.com/random_joke';

const jokeSetup = document.getElementById('joke-setup');
const jokePunchline = document.getElementById('joke-punchline');
const jokeCard = document.getElementById('joke-card');
const btnJoke = document.getElementById('btn-joke');
const btnReveal = document.getElementById('btn-reveal');
const btnCopy = document.getElementById('btn-copy');
const status = document.getElementById('status');

let currentJoke = null;

/**
 * Fetch a random joke from the API.
 * @returns {Promise<{setup: string, punchline: string}>}
 */
async function fetchJoke() {
  const response = await fetch(JOKE_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

/** Show a status message (clears after 3 s). */
function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.style.color = isError ? 'var(--danger, #f85149)' : 'var(--text-secondary, #8b949e)';
  setTimeout(() => (status.textContent = ''), 3000);
}

/** Reset the card to initial state. */
function resetCard() {
  jokeSetup.textContent = '';
  jokePunchline.textContent = '';
  jokePunchline.classList.add('hidden');
  btnReveal.classList.add('hidden');
  btnCopy.classList.add('hidden');
  jokeCard.classList.remove('revealed');
}

/** Generate and display a new joke. */
async function generateJoke() {
  resetCard();
  btnJoke.disabled = true;
  jokeSetup.textContent = '⏳ Ładowanie żartu…';
  status.textContent = '';

  try {
    currentJoke = await fetchJoke();
    jokeSetup.textContent = currentJoke.setup;
    btnReveal.classList.remove('hidden');
  } catch (err) {
    jokeSetup.textContent = '😅 Nie udało się pobrać żartu. Spróbuj ponownie.';
    showStatus(`Błąd: ${err.message}`, true);
  } finally {
    btnJoke.disabled = false;
  }
}

/** Reveal the punchline. */
function revealPunchline() {
  if (!currentJoke) return;
  jokePunchline.textContent = currentJoke.punchline;
  jokePunchline.classList.remove('hidden');
  jokeCard.classList.add('revealed');
  btnReveal.classList.add('hidden');
  btnCopy.classList.remove('hidden');
}

/** Copy the full joke to clipboard. */
async function copyJoke() {
  if (!currentJoke) return;
  const text = `${currentJoke.setup}\n${currentJoke.punchline}`;
  try {
    await navigator.clipboard.writeText(text);
    showStatus('✅ Skopiowano do schowka!');
  } catch {
    showStatus('❌ Nie można skopiować.', true);
  }
}

/* ── Event listeners ───────────────────────────────────────────────────── */
btnJoke.addEventListener('click', generateJoke);
btnReveal.addEventListener('click', revealPunchline);
btnCopy.addEventListener('click', copyJoke);

/* ── Auto-load first joke on page load ─────────────────────────────────── */
generateJoke();
