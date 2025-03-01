

const UIEventHandler = require("./solution");

describe("UIEventHandler Comprehensive Test Suite", () => {
  let element;
  let handler;

  // Helper: Create a fake DOM element with addEventListener and removeEventListener.
  const createFakeElement = () => {
    return {
      addEventListener: jest.fn((event, callback) => {
        this.listeners = this.listeners || {};
        this.listeners[event] = callback;
      }),
      removeEventListener: jest.fn((event, callback) => {
        if (this.listeners && this.listeners[event] === callback) {
          delete this.listeners[event];
        }
      }),
      dispatchEvent(event) {
        if (this.listeners && this.listeners[event.type]) {
          this.listeners[event.type](event);
        }
      },
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    element = createFakeElement();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should process a single "click" event correctly', () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    // Simulate a click event.
    element.listeners.click({ type: "click" });
    jest.advanceTimersByTime(101);
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(1);
    const log = handler.getEventLog();
    expect(log[0]).toMatch(
      /click event processed at \d+ via (debounce|throttle)/
    );
  });

  test('should debounce high-frequency "click" events', () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 300,
      eventTypes: ["click"],
    });
    // Fire 10 clicks in rapid succession.
    for (let i = 0; i < 10; i++) {
      element.listeners.click({ type: "click" });
    }
    // Advance less than debounce interval.
    jest.advanceTimersByTime(50);
    // Throttle should have processed one immediately.
    expect(handler.getEventCount()).toBe(1);
    // Advance past debounce.
    jest.advanceTimersByTime(51);
    // Debounce should fire once more.
    expect(handler.getEventCount()).toBe(2);
  });

  test("should throttle events such that rapid events do not over-process", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 150,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    // Fire an event, then another after 10ms, then another after 10ms...
    element.listeners.click({ type: "click" });
    jest.advanceTimersByTime(10);
    element.listeners.click({ type: "click" });
    jest.advanceTimersByTime(10);
    element.listeners.click({ type: "click" });
    // Immediately, throttle should have processed the first event.
    expect(handler.getEventCount()).toBe(1);
    // Advance time beyond throttleInterval.
    jest.advanceTimersByTime(210);
    // Now, debounce from the last event should process.
    expect(handler.getEventCount()).toBe(2);
  });

  test("should handle multiple event types independently", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 150,
      eventTypes: ["click", "mouseover"],
    });
    // Simulate a click event.
    element.listeners.click({ type: "click" });
    // Simulate a mouseover event.
    element.listeners.mouseover({ type: "mouseover" });
    // Advance timers sufficiently.
    jest.advanceTimersByTime(101);
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(2);
    const logs = handler.getEventLog();
    expect(logs.some((l) => l.startsWith("click"))).toBe(true);
    expect(logs.some((l) => l.startsWith("mouseover"))).toBe(true);
  });

  test("should not process event after detachEvents is called", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    // Detach events.
    handler.detachEvents();
    // Simulate a click event.
    if (element.listeners.click) {
      element.listeners.click({ type: "click" });
    }
    jest.advanceTimersByTime(150);
    // Count should remain unchanged.
    expect(handler.getEventCount()).toBe(0);
  });

  test("should clear event log and reset count using clearLog and resetCount", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    // Simulate events.
    element.listeners.click({ type: "click" });
    jest.advanceTimersByTime(101);
    expect(handler.getEventCount()).toBeGreaterThan(0);
    expect(handler.getEventLog().length).toBeGreaterThan(0);
    handler.clearLog();
    handler.resetCount();
    expect(handler.getEventCount()).toBe(0);
    expect(handler.getEventLog().length).toBe(0);
  });

  test("simulateEvent should manually trigger an event", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click", "dblclick"],
    });
    handler.simulateEvent("dblclick", { type: "dblclick", custom: "data" });
    jest.advanceTimersByTime(101);
    expect(handler.getEventLog()[0]).toMatch(
      /dblclick event processed at \d+ via (debounce|throttle)/
    );
  });

  test("should handle unknown event types gracefully", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    // simulateEvent for an event type that is not registered.
    expect(() => handler.simulateEvent("scroll")).not.toThrow();
    // No changes to event count.
    expect(handler.getEventCount()).toBe(0);
  });

  test("should process no events if none are triggered", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    jest.advanceTimersByTime(500);
    expect(handler.getEventCount()).toBe(0);
    expect(handler.getEventLog().length).toBe(0);
  });

  test("should override default options via constructor", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 50,
      throttleInterval: 100,
      eventTypes: ["mousemove"],
      heavyProcessingLoops: 50000,
    });
    element.listeners.mousemove({ type: "mousemove" });
    jest.advanceTimersByTime(51);
    expect(handler.getEventCount()).toBeGreaterThan(0);
    // Check that the event log contains "mousemove"
    expect(handler.getEventLog()[0]).toMatch(
      /mousemove event processed at \d+ via (debounce|throttle)/
    );
  });

  test("stress test: process a large batch of events efficiently", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 150,
      eventTypes: ["click"],
    });
    // Simulate 100 rapid click events.
    for (let i = 0; i < 100; i++) {
      element.listeners.click({ type: "click" });
    }
    // Advance time in steps.
    jest.advanceTimersByTime(50);
    // Count should be at least 1 from throttle.
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(1);
    jest.advanceTimersByTime(100);
    // After debounce, one more event should have processed.
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(2);
  });

  test("should process events from multiple types in a stress scenario", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 80,
      throttleInterval: 120,
      eventTypes: ["click", "mouseover", "keydown"],
    });
    // Fire a mixture of events rapidly.
    for (let i = 0; i < 30; i++) {
      element.listeners.click({ type: "click" });
      element.listeners.mouseover({ type: "mouseover" });
      element.listeners.keydown({ type: "keydown" });
    }
    jest.advanceTimersByTime(90);
    // Expect each event type to have processed at least once via debounce.
    const log = handler.getEventLog();
    expect(
      log.filter((l) => l.startsWith("click")).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      log.filter((l) => l.startsWith("mouseover")).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      log.filter((l) => l.startsWith("keydown")).length
    ).toBeGreaterThanOrEqual(1);
    // Total count should reflect both throttle and debounce calls.
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(6);
  });
});
