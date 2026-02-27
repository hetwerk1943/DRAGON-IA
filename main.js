/* main.js — Core app logic for DRAGON-IA UltraChat AI Omega */
"use strict";

(function () {
  /* --- Ad ON/OFF Toggle --- */
  var adsEnabled = true;

  function toggleAds() {
    adsEnabled = !adsEnabled;
    var banners = document.querySelectorAll(".ad-banner");
    for (var i = 0; i < banners.length; i++) {
      if (adsEnabled) {
        banners[i].classList.remove("hidden");
      } else {
        banners[i].classList.add("hidden");
      }
    }
    var btn = document.getElementById("btn-ads-toggle");
    if (btn) {
      btn.textContent = "Ads: " + (adsEnabled ? "ON" : "OFF");
    }
  }

  /* --- Section Navigation --- */
  function showSection(sectionId) {
    var sections = document.querySelectorAll(".section");
    for (var i = 0; i < sections.length; i++) {
      sections[i].classList.add("hidden");
      sections[i].classList.remove("active");
    }
    var target = document.getElementById(sectionId);
    if (target) {
      target.classList.remove("hidden");
      target.classList.add("active");
    }
    var buttons = document.querySelectorAll(".nav-btn");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].classList.remove("active");
    }
  }

  /* --- Chat Logic --- */
  function appendMessage(text, role) {
    var log = document.getElementById("chat-log");
    if (!log) {
      return;
    }
    var div = document.createElement("div");
    div.className = "chat-msg chat-msg--" + role;
    div.textContent = (role === "user" ? "Ty: " : "Bot: ") + text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function handleChatSubmit(event) {
    event.preventDefault();
    var input = document.getElementById("chat-input");
    if (!input) {
      return;
    }
    var message = input.value.trim();
    if (message === "") {
      return;
    }

    appendMessage(message, "user");
    input.value = "";

    var reply =
      typeof Agent !== "undefined"
        ? Agent.chat(message)
        : "Agent niedostępny.";
    appendMessage(reply, "bot");
  }

  /* --- Quiz UI --- */
  function renderQuestion(q) {
    var container = document.getElementById("quiz-container");
    if (!container || !q) {
      return;
    }
    var html =
      "<p><strong>Pytanie " +
      (q.index + 1) +
      ":</strong> " +
      q.question +
      "</p>";
    for (var i = 0; i < q.options.length; i++) {
      html +=
        '<button class="quiz-option" data-index="' +
        i +
        '">' +
        q.options[i] +
        "</button><br>";
    }
    container.innerHTML = html;

    var buttons = container.querySelectorAll(".quiz-option");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-index"), 10);
        if (typeof Quiz !== "undefined") {
          var result = Quiz.answer(idx);
          if (result.done) {
            container.innerHTML =
              "<p>Quiz zakończony! Wynik: " +
              result.score +
              "/" +
              result.total +
              "</p>";
          } else if (result.next) {
            renderQuestion(result.next);
          }
        }
      });
    }
  }

  /* --- Service Worker Registration --- */
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(function (reg) {
          console.log("Service Worker registered, scope:", reg.scope);
        })
        .catch(function (err) {
          console.warn("Service Worker registration failed:", err);
        });
    }
  }

  /* --- Init --- */
  function init() {
    registerServiceWorker();

    var btnChat = document.getElementById("btn-chat");
    var btnQuiz = document.getElementById("btn-quiz");
    var btnAds = document.getElementById("btn-ads-toggle");
    var chatForm = document.getElementById("chat-form");
    var quizStart = document.getElementById("quiz-start");

    if (btnChat) {
      btnChat.addEventListener("click", function () {
        showSection("section-chat");
        this.classList.add("active");
      });
    }

    if (btnQuiz) {
      btnQuiz.addEventListener("click", function () {
        showSection("section-quiz");
        this.classList.add("active");
      });
    }

    if (btnAds) {
      btnAds.addEventListener("click", toggleAds);
    }

    if (chatForm) {
      chatForm.addEventListener("submit", handleChatSubmit);
    }

    if (quizStart) {
      quizStart.addEventListener("click", function () {
        if (typeof Quiz !== "undefined") {
          var first = Quiz.start();
          renderQuestion(first);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
