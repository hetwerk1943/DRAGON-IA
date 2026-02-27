'use strict';

const { createMessage, formatMessage, validateInput, sanitizeInput } = require('../src/app');

describe('app.js', () => {
  describe('createMessage', () => {
    test('creates a user message with correct fields', () => {
      const msg = createMessage('Hello', 'user');
      expect(msg.text).toBe('Hello');
      expect(msg.sender).toBe('user');
      expect(typeof msg.timestamp).toBe('number');
    });

    test('creates a bot message', () => {
      const msg = createMessage('Response', 'bot');
      expect(msg.sender).toBe('bot');
      expect(msg.text).toBe('Response');
    });

    test('trims whitespace from text', () => {
      const msg = createMessage('  hello  ', 'user');
      expect(msg.text).toBe('hello');
    });
  });

  describe('formatMessage', () => {
    test('formats user message with "Ty" prefix', () => {
      const result = formatMessage({ text: 'hi', sender: 'user' });
      expect(result).toBe('Ty: hi');
    });

    test('formats bot message with "DRAGON-IA" prefix', () => {
      const result = formatMessage({ text: 'hello', sender: 'bot' });
      expect(result).toBe('DRAGON-IA: hello');
    });

    test('returns empty string for null input', () => {
      expect(formatMessage(null)).toBe('');
    });

    test('returns empty string for message with empty text', () => {
      expect(formatMessage({ text: '', sender: 'user' })).toBe('');
    });
  });

  describe('validateInput', () => {
    test('returns true for valid string', () => {
      expect(validateInput('hello')).toBe(true);
    });

    test('returns false for empty string', () => {
      expect(validateInput('')).toBe(false);
    });

    test('returns false for whitespace-only string', () => {
      expect(validateInput('   ')).toBe(false);
    });

    test('returns false for non-string input', () => {
      expect(validateInput(123)).toBe(false);
      expect(validateInput(null)).toBe(false);
      expect(validateInput(undefined)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('escapes HTML special characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    test('escapes ampersands', () => {
      expect(sanitizeInput('a & b')).toBe('a &amp; b');
    });

    test('returns empty string for non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(123)).toBe('');
    });
  });
});
