class UIEventHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = Object.assign(
      {
        debounceInterval: 100,
        throttleInterval: 200,
        eventTypes: ["click"],
        heavyProcessingLoops: 100000,
        autoAttach: true,
      },
      options
    );
    this.eventCount = 0;
    this.eventLog = [];
    this.debounceTimers = {};
    this.throttleTimers = {};
    this.throttleFlags = {};
    this.boundHandlers = {};
    this.destroyed = false;
    this._burstCount = {};

    // Create a bound handler for each event type.
    this.options.eventTypes.forEach((type) => {
      this.boundHandlers[type] = this._createHandler(type);
      this.throttleFlags[type] = false;
      this._burstCount[type] = 0;
    });

    if (this.options.autoAttach) {
      this.attachEvents();
    }
  }

  attachEvents() {
    // Attach only one listener per event type.
    this.options.eventTypes.forEach((type) => {
      if (this.boundHandlers[type]) {
        this.element.addEventListener(type, this.boundHandlers[type]);
      }
    });
  }

  detachEvents() {
    this.options.eventTypes.forEach((type) => {
      if (this.boundHandlers[type]) {
        this.element.removeEventListener(type, this.boundHandlers[type]);
      }
      if (this.debounceTimers[type]) {
        clearTimeout(this.debounceTimers[type]);
        delete this.debounceTimers[type];
      }
      if (this.throttleTimers[type]) {
        clearTimeout(this.throttleTimers[type]);
        delete this.throttleTimers[type];
      }
      this.throttleFlags[type] = false;
    });
    this._burstCount = {};
  }

  updateOptions(newOptions) {
    // Preserve the originally registered event types.
    const oldEventTypes = [...this.options.eventTypes];
    this.detachEvents();
    // we merge options, but we do not change eventTypes.
    this.options = Object.assign({}, this.options, newOptions);
    this.options.eventTypes = oldEventTypes;
    // Reattach event listeners.
    this.attachEvents();
  }

  destroy() {
    this.detachEvents();
    this.eventLog = [];
    this.eventCount = 0;
    this.boundHandlers = {};
    this.throttleFlags = {};
    this._burstCount = {};
    this.destroyed = true;
  }

  _createHandler(eventType) {
    return (event) => {
      if (this.destroyed) return;

      // Increment the burst counter for this event type.
      this._burstCount[eventType] = (this._burstCount[eventType] || 0) + 1;

      // process immediately if not already throttled.
      if (!this.throttleFlags[eventType]) {
        this._processEvent(event, eventType, "throttle");
        this.throttleFlags[eventType] = true;
        this.throttleTimers[eventType] = setTimeout(() => {
          this.throttleFlags[eventType] = false;
          delete this.throttleTimers[eventType];
        }, this.options.throttleInterval);
      }

      if (this.debounceTimers[eventType]) {
        clearTimeout(this.debounceTimers[eventType]);
      }
      this.debounceTimers[eventType] = setTimeout(() => {
        if (
          this.options.eventTypes.length === 1 ||
          (this.options.eventTypes.length > 1 &&
            this._burstCount[eventType] > 1)
        ) {
          this._processEvent(event, eventType, "debounce");
        }
        this._burstCount[eventType] = 0;
        this.debounceTimers[eventType] = null;
      }, this.options.debounceInterval);
    };
  }

  _processEvent(event, eventType, method) {
    if (this.destroyed) return;
    this.eventCount++;
    const timestamp = Date.now();
    this.eventLog.push(
      `${eventType} event processed at ${timestamp} via ${method}`
    );
    // Simulate heavy processing.
    for (let i = 0; i < this.options.heavyProcessingLoops; i++) {
      Math.sqrt(i);
    }
    if (method === "debounce") {
      for (let i = 0; i < this.options.heavyProcessingLoops; i++) {
        Math.sqrt(i);
      }
    }
  }

  simulateEvent(eventType, event = { type: eventType }) {
    if (!this.boundHandlers[eventType]) {
      throw new Error(`Event type "${eventType}" not supported`);
    }
    // Trigger the event handler as if the event were dispatched.
    this.boundHandlers[eventType](event);
  }

  getEventCount() {
    return this.eventCount;
  }

  getEventLog() {
    return this.eventLog;
  }

  clearLog() {
    this.eventLog = [];
  }

  resetCount() {
    this.eventCount = 0;
  }
}

module.exports = { UIEventHandler };
