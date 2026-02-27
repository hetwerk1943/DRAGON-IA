/**
 * @jest-environment jsdom
 */

'use strict';

const { appendMessage } = require('../main');

describe('main.js', () => {
  describe('appendMessage', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
    });

    test('appends a user message to the container', () => {
      appendMessage(container, { text: 'hi', sender: 'user' });
      expect(container.children.length).toBe(1);
      expect(container.children[0].className).toBe('message user');
    });

    test('appends a bot message to the container', () => {
      appendMessage(container, { text: 'hello', sender: 'bot' });
      expect(container.children.length).toBe(1);
      expect(container.children[0].className).toBe('message bot');
    });

    test('does nothing when container is null', () => {
      expect(() => appendMessage(null, { text: 'hi', sender: 'user' })).not.toThrow();
    });

    test('does nothing when message is null', () => {
      appendMessage(container, null);
      expect(container.children.length).toBe(0);
    });
  });
});
