window.ADSENSE_ENABLED = false;

function applyAdSenseMode() {
  const display = window.ADSENSE_ENABLED ? 'block' : 'none';
  ['ad-top', 'ad-middle', 'ad-bottom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = display;
      if (!el.dataset.loaded) {
        el.dataset.loaded = '1';
        el.innerText = 'Reklama';
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', applyAdSenseMode);
