'use strict';
/**
 * Tests for the EventBus module.
 */
const bus = require('../agents/EventBus');

test('EventBus: emit and subscribe', (done) => {
  const unsub = bus.on('test:channel', (payload) => {
    expect(payload.value).toBe(42);
    unsub();
    done();
  });
  bus.emit('test:channel', { value: 42 });
});

test('EventBus: getHistory returns recent events', () => {
  bus.emit('test:history', { x: 1 });
  bus.emit('test:history', { x: 2 });
  const history = bus.getHistory(10);
  const entries = history.filter(e => e.channel === 'test:history');
  expect(entries.length).toBeGreaterThanOrEqual(2);
});

test('EventBus: unsubscribe stops handler', (done) => {
  let count = 0;
  const unsub = bus.on('test:unsub', () => { count++; });
  bus.emit('test:unsub', {});
  unsub();
  bus.emit('test:unsub', {});
  setImmediate(() => {
    expect(count).toBe(1);
    done();
  });
});
