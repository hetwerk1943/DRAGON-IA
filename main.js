/**
 * DRAGON-IA — main.js
 * Core application logic: navigation, AdSense ON/OFF mode,
 * chat interface, and service-worker registration.
 */
(function () {
  "use strict";

  // --- Navigation ---
  var navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-section");
      document.querySelectorAll(".section").forEach(function (sec) {
        sec.classList.remove("active");
      });
      navBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      var section = document.getElementById("section-" + target);
      if (section) {
        section.classList.add("active");
      }
      btn.classList.add("active");
    });
  });

  // --- AdSense ON/OFF Toggle ---
  var adsToggle = document.getElementById("ads-toggle-checkbox");
  var adBanners = document.querySelectorAll(".ad-banner");

  function setAdsVisibility(visible) {
    adBanners.forEach(function (banner) {
      if (visible) {
        banner.classList.remove("hidden");
      } else {
        banner.classList.add("hidden");
      }
    });
  }

  if (adsToggle) {
    adsToggle.addEventListener("change", function () {
      setAdsVisibility(adsToggle.checked);
    });
    // Apply initial state
    setAdsVisibility(adsToggle.checked);
  }

  // --- Chat ---
  var chatForm = document.getElementById("chat-form");
  var chatInput = document.getElementById("chat-input");
  var chatMessages = document.getElementById("chat-messages");

  function appendMessage(text, sender) {
    var msg = document.createElement("div");
    msg.className = "chat-msg chat-msg--" + sender;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getBotReply(userText) {
    // Placeholder: echo response. Replace with real API call.
    return "DRAGON-IA: Otrzymałem wiadomość — \"" + userText + "\"";
  }

  if (chatForm) {
    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = chatInput.value.trim();
      if (!text) return;
      appendMessage(text, "user");
      chatInput.value = "";
      var reply = getBotReply(text);
      appendMessage(reply, "bot");
    });
  }

  // --- Service Worker Registration ---
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("service-worker.js")
        .then(function (reg) {
          console.log("Service Worker registered, scope:", reg.scope);
        })
        .catch(function (err) {
          console.warn("Service Worker registration failed:", err);
        });
    });
  }
})();
