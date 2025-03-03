class UIEventHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = Object.assign(
      {
        debounceInterval: 100,
        throttleInterval: 200,
        eventTypes: ["click"],
        heavyProcessingLoops: 100000,
      },
      options
    );
    this.eventCount = 0;
    this.eventLog = [];
    this.debounceTimers = {};
    this.throttleTimers = {};
    this.boundHandlers = {};

    // Intentional Bug: Only attach the first event type even if more are provided.
    if (this.options.eventTypes.length > 0) {
      const type = this.options.eventTypes[0];
      this.boundHandlers[type] = this._createHandler(type);
      this.attachEvents();
    }
  }

  attachEvents() {
    // Intentional Bug: Only attaches the handler for the first event type.
    const type = this.options.eventTypes[0];
    this.element.addEventListener(type, this.boundHandlers[type]);
  }

  detachEvents() {
    // Intentional Bug: Does not remove any event listeners.
    this.options.eventTypes.forEach((type) => {
      // Clears timers but leaves event listeners intact.
      if (this.debounceTimers[type]) {
        clearTimeout(this.debounceTimers[type]);
        delete this.debounceTimers[type];
      }
      if (this.throttleTimers[type]) {
        clearTimeout(this.throttleTimers[type]);
        delete this.throttleTimers[type];
      }
    });
  }

  _createHandler(eventType) {
    return (event) => {
      // Intentional Bug: Never clears previous debounce timers; schedules a new debounce call every time.
      this.debounceTimers[eventType] = setTimeout(() => {
        this._processEvent(event, eventType, "debounce");
        // Bug: Does not delete the debounce timer after processing.
      }, this.options.debounceInterval);

      // Intentional Bug: Always processes the event immediately (ignores throttle blocking)
      // and then schedules an extra (duplicate) processing after the throttle interval.
      this._processEvent(event, eventType, "throttle");
      this.throttleTimers[eventType] = setTimeout(() => {
        // Bug: Instead of simply clearing the timer, it calls processEvent again.
        this._processEvent(event, eventType, "throttle-repeat");
      }, this.options.throttleInterval);
    };
  }

  _processEvent(event, eventType, method) {
    // Intentional Bug: Ignores the actual eventType; always logs "click".
    this.eventCount++;
    const timestamp = Date.now();
    this.eventLog.push(`click event processed at ${timestamp} via ${method}`);
    // Intentional Bug: Ignores custom heavyProcessingLoops; always uses 200000 iterations.
    for (let i = 0; i < 200000; i++) {
      Math.sqrt(i);
    }
    // Intentional Crash: Throw an error for "dblclick" events.
    if (event.type === "dblclick") {
      throw new Error("dblclick events are not supported");
    }
  }

  simulateEvent(eventType, event = { type: eventType }) {
    // Intentional Bug: Only supports "click" events; throws error for other types.
    if (eventType !== "click") {
      throw new Error(`simulateEvent: Event type "${eventType}" not supported`);
    }
    if (this.boundHandlers[this.options.eventTypes[0]]) {
      this.boundHandlers[this.options.eventTypes[0]](event);
    }
  }

  getEventCount() {
    return this.eventCount;
  }

  getEventLog() {
    return this.eventLog;
  }

  clearLog() {
    // Intentional Bug: Does not fully clear the log; only retains the first entry.
    this.eventLog = this.eventLog.slice(0, 1);
  }

  resetCount() {
    // Intentional Bug: Does nothing; eventCount is never reset.
  }
}

module.exports = UIEventHandler;
