class UIEventHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      debounceInterval: 100,
      throttleInterval: 200,
      eventTypes: ["click"],
      heavyProcessingLoops: 100000,
      ...options,
    };

    this.eventCount = 0;
    this.eventLog = [];
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.lastThrottleExecutions = new Map();
    this.boundHandlers = new Map();
    this.isAttached = false;

    this.initializeHandlers();
    this.attachEvents();
  }

  initializeHandlers() {
    this.options.eventTypes.forEach((type) => {
      this.boundHandlers.set(type, this._createHandler(type));
    });
  }

  attachEvents() {
    if (!this.isAttached) {
      this.options.eventTypes.forEach((type) => {
        const handler = this.boundHandlers.get(type);
        this.element.addEventListener(type, handler);
      });
      this.isAttached = true;
    }
  }

  detachEvents() {
    if (this.isAttached) {
      this.options.eventTypes.forEach((type) => {
        const handler = this.boundHandlers.get(type);
        this.element.removeEventListener(type, handler);

        if (this.debounceTimers.has(type)) {
          clearTimeout(this.debounceTimers.get(type));
          this.debounceTimers.delete(type);
        }

        if (this.throttleTimers.has(type)) {
          clearTimeout(this.throttleTimers.get(type));
          this.throttleTimers.delete(type);
        }
      });
      this.isAttached = false;
    }
  }

  _createHandler(eventType) {
    return (event) => {
      if (!this.isAttached) return;

      // Handle debouncing
      if (this.debounceTimers.has(eventType)) {
        clearTimeout(this.debounceTimers.get(eventType));
      }

      const debounceTimer = setTimeout(() => {
        this._processEvent(event, eventType, "debounce");
        this.debounceTimers.delete(eventType);
      }, this.options.debounceInterval);

      this.debounceTimers.set(eventType, debounceTimer);

      // Handle throttling
      const now = Date.now();
      const lastExecution = this.lastThrottleExecutions.get(eventType) || 0;

      if (now - lastExecution >= this.options.throttleInterval) {
        this._processEvent(event, eventType, "throttle");
        this.lastThrottleExecutions.set(eventType, now);
      }
    };
  }

  _processEvent(event, eventType, method) {
    if (!this.isAttached) return;

    this.eventCount++;
    const timestamp = Date.now();
    this.eventLog.push(
      `${eventType} event processed at ${timestamp} via ${method}`
    );

    for (let i = 0; i < this.options.heavyProcessingLoops; i++) {
      Math.sqrt(i);
    }
  }

  simulateEvent(eventType, event = { type: eventType }) {
    const handler = this.boundHandlers.get(eventType);
    if (handler && this.isAttached) {
      handler(event);
    }
  }

  getEventCount() {
    return this.eventCount;
  }

  getEventLog() {
    return [...this.eventLog];
  }

  clearLog() {
    this.eventLog = [];
  }

  resetCount() {
    this.eventCount = 0;
  }

  reset() {
    this.detachEvents();
    this.clearLog();
    this.resetCount();
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.lastThrottleExecutions.clear();
  }
}

module.exports = UIEventHandler;
