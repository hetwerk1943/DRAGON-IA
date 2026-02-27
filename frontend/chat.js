const BACKEND_URL = "http://localhost:3000/chat";

async function sendMessage() {
  const input = document.getElementById('userInput').value;
  const output = document.getElementById('chatOutput');
  output.textContent += "Ty: " + input + "\n";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    const data = await res.json();
    const reply = data.choices?.[0].message?.content || "Brak odpowiedzi";
    output.textContent += "AI: " + reply + "\n\n";
    document.getElementById('userInput').value = "";
  } catch(err) {
    output.textContent += "Błąd serwera\n\n";
    console.error(err);
  }
}

// SAFE AdSense ON/OFF
window.ADSENSE_ENABLED = false;
function applyAdSenseMode() {
  const display = window.ADSENSE_ENABLED ? 'block' : 'none';
  ['ad-top', 'ad-middle', 'ad-bottom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
  });
}
