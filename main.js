"use strict";

// SAFE AdSense ON/OFF toggle
// Set to true to enable AdSense ads, false to disable (e.g. during development)
var ADSENSE_ENABLED = false;

function initAdSense() {
  if (!ADSENSE_ENABLED) {
    return;
  }
  var adScript = document.createElement("script");
  adScript.async = true;
  adScript.crossOrigin = "anonymous";
  adScript.src =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX";
  document.head.appendChild(adScript);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(function (registration) {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch(function (error) {
        console.error("Service Worker registration failed:", error);
      });
  }
}

function initApp() {
  registerServiceWorker();
  initAdSense();

  var chatForm = document.getElementById("chat-form");
  var chatInput = document.getElementById("chat-input");
  var chatMessages = document.getElementById("chat-messages");

  if (chatForm) {
    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = chatInput ? chatInput.value.trim() : "";
      if (!message) {
        return;
      }
      appendMessage("user", message);
      if (chatInput) {
        chatInput.value = "";
      }
      sendToAgent(message, function (reply) {
        appendMessage("agent", reply);
      });
    });
  }

  function appendMessage(role, text) {
    if (!chatMessages) {
      return;
    }
    var div = document.createElement("div");
    div.className = "message message--" + role;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

document.addEventListener("DOMContentLoaded", initApp);
