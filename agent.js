"use strict";

/**
 * DRAGON-IA Agent module
 * Handles communication with the AI backend.
 */

var Agent = (function () {
  var API_URL = "/api/agent";

  /**
   * Send a message to the AI agent and invoke callback with the reply.
   * @param {string} message
   * @param {function} callback
   */
  function send(message, callback) {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        callback(data.reply || "No reply from agent.");
      })
      .catch(function (error) {
        console.error("Agent error:", error);
        callback("Error communicating with agent.");
      });
  }

  return { send: send };
})();

// Expose as a global so main.js can call sendToAgent()
// eslint-disable-next-line no-unused-vars
var sendToAgent = Agent.send;
