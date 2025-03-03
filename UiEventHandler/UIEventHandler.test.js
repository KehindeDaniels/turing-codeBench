const {UIEventHandler} = require("./solution");

describe("UIEventHandler", () => {
  let element;
  let handler;

  const createFakeElement = () => {
    return {
      listeners: {},
      addEventListener: function (event, callback) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
      },
      removeEventListener: function (event, callback) {
        if (this.listeners[event]) {
          this.listeners[event] = this.listeners[event].filter(
            (cb) => cb !== callback
          );
        }
      },
      dispatchEvent: function (event) {
        if (this.listeners[event.type]) {
          this.listeners[event.type].forEach((cb) => cb(event));
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

  test("should process a single 'click' event correctly", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    // Simulate a click event.
    element.listeners["click"].forEach((fn) => fn({ type: "click" }));
    jest.advanceTimersByTime(101);
    // Expect both a throttle and a debounce call (total 2) if correctly processed.
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(2);
    const log = handler.getEventLog();
    expect(log[0]).toMatch(
      /click event processed at \d+ via (debounce|throttle)/
    );
  });

test("should debounce high-frequency 'click' events", () => {
  handler = new UIEventHandler(element, {
    debounceInterval: 100,
    throttleInterval: 300,
    eventTypes: ["click"],
  });
  // Fire 10 clicks in rapid succession.
  for (let i = 0; i < 10; i++) {
    element.listeners["click"].forEach((fn) => fn({ type: "click" }));
  }
  // Advance time less than debounce interval: only the immediate throttle call should have occurred.
  jest.advanceTimersByTime(50);
  expect(handler.getEventCount()).toBe(1);
  // Advance time past the debounce interval: the debounce call should now fire.
  jest.advanceTimersByTime(51);
  expect(handler.getEventCount()).toBe(2);
});

test("should throttle events such that rapid events do not over-process", () => {
  handler = new UIEventHandler(element, {
    debounceInterval: 150,
    throttleInterval: 200,
    eventTypes: ["click"],
  });
  // Fire an event, then another after 10ms, then another after 10ms.
  element.listeners["click"].forEach((fn) => fn({ type: "click" }));
  jest.advanceTimersByTime(10);
  element.listeners["click"].forEach((fn) => fn({ type: "click" }));
  jest.advanceTimersByTime(10);
  element.listeners["click"].forEach((fn) => fn({ type: "click" }));

  // Immediately after firing events, only the immediate throttle call should have executed.
  expect(handler.getEventCount()).toBe(1);

  // Advance time past the debounce interval.
  jest.advanceTimersByTime(150);
  // Now, the debounce call should fire.
  expect(handler.getEventCount()).toBe(2);

  // Further advancement should not increase the count.
  jest.advanceTimersByTime(210);
  expect(handler.getEventCount()).toBe(2);
});

  test("should handle multiple event types independently", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 150,
      eventTypes: ["click", "mouseover", "keydown"],
    });
    // Simulate events for each type.
    element.listeners["click"].forEach((fn) => fn({ type: "click" }));
    if (element.listeners["mouseover"]) {
      element.listeners["mouseover"].forEach((fn) => fn({ type: "mouseover" }));
    }
    if (element.listeners["keydown"]) {
      element.listeners["keydown"].forEach((fn) => fn({ type: "keydown" }));
    }
    jest.advanceTimersByTime(101);
    // each event type processes once.
    expect(handler.getEventCount()).toBe(3);
    const logs = handler.getEventLog();
    expect(logs.some((l) => l.startsWith("click"))).toBe(true);
    expect(logs.some((l) => l.startsWith("mouseover"))).toBe(true);
    expect(logs.some((l) => l.startsWith("keydown"))).toBe(true);
  });

  test("should not process events after detachEvents is called", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    handler.detachEvents();
    if (element.listeners["click"]) {
      element.listeners["click"].forEach((fn) => fn({ type: "click" }));
    }
    jest.advanceTimersByTime(150);
    expect(handler.getEventCount()).toBe(0);
  });

  test("should clear event log and reset count using clearLog and resetCount", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    element.listeners["click"].forEach((fn) => fn({ type: "click" }));
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

  test("simulateEvent should throw for unsupported event types", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    expect(() => handler.simulateEvent("scroll")).toThrow();
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
    element.listeners["mousemove"].forEach((fn) => fn({ type: "mousemove" }));
    jest.advanceTimersByTime(51);
    expect(handler.getEventCount()).toBeGreaterThan(0);
    expect(handler.getEventLog()[0]).toMatch(
      /mousemove event processed at \d+ via (debounce|throttle)/
    );
  });

  test("updateOptions should update intervals but not eventTypes", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click", "mouseover"],
    });
    handler.updateOptions({
      debounceInterval: 80,
      throttleInterval: 120,
      eventTypes: ["keydown"],
    });
    expect(handler.options.debounceInterval).toBe(80);
    expect(handler.options.throttleInterval).toBe(120);
    // Event types remain unchanged.
    expect(handler.options.eventTypes).toEqual(["click", "mouseover"]);
    // Simulate a click event.
    element.listeners["click"].forEach((fn) => fn({ type: "click" }));
    jest.advanceTimersByTime(81);
    expect(handler.getEventCount()).toBeGreaterThan(0);
  });

  test("destroy should clear all state and mark handler as destroyed", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
    });
    element.listeners["click"].forEach((fn) => fn({ type: "click" }));
    jest.advanceTimersByTime(101);
    expect(handler.getEventCount()).toBeGreaterThan(0);
    handler.destroy();
    expect(handler.getEventCount()).toBe(0);
    expect(handler.getEventLog().length).toBe(0);
    expect(handler.destroyed).toBe(true);
  });

  test("stress test: process a large batch of events efficiently", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 100,
      throttleInterval: 150,
      eventTypes: ["click"],
    });
    for (let i = 0; i < 100; i++) {
      element.listeners["click"].forEach((fn) => fn({ type: "click" }));
    }
    jest.advanceTimersByTime(50);
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(1);
    jest.advanceTimersByTime(100);
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(2);
  });

  test("should process events from multiple types in a stress scenario", () => {
    handler = new UIEventHandler(element, {
      debounceInterval: 80,
      throttleInterval: 120,
      eventTypes: ["click", "mouseover", "keydown"],
    });
    for (let i = 0; i < 30; i++) {
      element.listeners["click"].forEach((fn) => fn({ type: "click" }));
      if (element.listeners["mouseover"]) {
        element.listeners["mouseover"].forEach((fn) =>
          fn({ type: "mouseover" })
        );
      }
      if (element.listeners["keydown"]) {
        element.listeners["keydown"].forEach((fn) => fn({ type: "keydown" }));
      }
    }
    jest.advanceTimersByTime(90);
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
    expect(handler.getEventCount()).toBeGreaterThanOrEqual(6);
  });
});
