/**
 * DRAGON-IA — quiz.js
 * Simple AI quiz module with sample questions and scoring.
 */
(function () {
  "use strict";

  var quizArea = document.getElementById("quiz-area");
  var startBtn = document.getElementById("quiz-start-btn");

  var questions = [
    {
      q: "Co oznacza skrot AI?",
      options: [
        "Automatyczna Integracja",
        "Sztuczna Inteligencja",
        "Algorytm Informacyjny",
        "Adaptacyjna Infrastruktura"
      ],
      answer: 1
    },
    {
      q: "Ktory jezyk jest najpopularniejszy w AI/ML?",
      options: ["Java", "C++", "Python", "Ruby"],
      answer: 2
    },
    {
      q: "Co to jest PWA?",
      options: [
        "Progressive Web App",
        "Private Web Access",
        "Public Wireless API",
        "Portable Widget Architecture"
      ],
      answer: 0
    }
  ];

  var currentIndex = 0;
  var score = 0;

  function showQuestion(index) {
    if (index >= questions.length) {
      quizArea.innerHTML =
        "<p><strong>Koniec quizu!</strong></p>" +
        "<p>Wynik: " + score + " / " + questions.length + "</p>";
      startBtn.textContent = "Zagraj ponownie";
      return;
    }

    var q = questions[index];
    var html = "<p><strong>" + (index + 1) + ". " + q.q + "</strong></p>";
    q.options.forEach(function (opt, i) {
      html +=
        '<button class="quiz-option" data-index="' + i + '">' +
        opt +
        "</button>";
    });
    quizArea.innerHTML = html;

    quizArea.querySelectorAll(".quiz-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chosen = parseInt(btn.getAttribute("data-index"), 10);
        quizArea.querySelectorAll(".quiz-option").forEach(function (b) {
          b.disabled = true;
          var idx = parseInt(b.getAttribute("data-index"), 10);
          if (idx === q.answer) {
            b.classList.add("correct");
          } else if (idx === chosen && chosen !== q.answer) {
            b.classList.add("wrong");
          }
        });
        if (chosen === q.answer) {
          score++;
        }
        currentIndex++;
        setTimeout(function () {
          showQuestion(currentIndex);
        }, 900);
      });
    });
  }

  if (startBtn && quizArea) {
    startBtn.addEventListener("click", function () {
      currentIndex = 0;
      score = 0;
      startBtn.textContent = "Rozpocznij quiz";
      showQuestion(0);
    });
  }
})();
