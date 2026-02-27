/**
 * DRAGON-IA — agent.js
 * AI Agent mode: accepts a task description, simulates processing,
 * and displays output in the agent panel.
 */
(function () {
  "use strict";

  var runBtn = document.getElementById("agent-run-btn");
  var taskInput = document.getElementById("agent-task-input");
  var output = document.getElementById("agent-output");

  function runAgent(task) {
    output.textContent = "Agent pracuje nad zadaniem...\n";
    // Simulate agent processing with a placeholder response
    setTimeout(function () {
      output.textContent +=
        "Zadanie: " + task + "\n" +
        "Status: zakonczone (tryb demo)\n" +
        "Wynik: Agent przetworzył zapytanie pomyślnie.";
    }, 1200);
  }

  if (runBtn && taskInput && output) {
    runBtn.addEventListener("click", function () {
      var task = taskInput.value.trim();
      if (!task) {
        output.textContent = "Proszę wpisać opis zadania.";
        return;
      }
      runAgent(task);
    });
  }
})();
