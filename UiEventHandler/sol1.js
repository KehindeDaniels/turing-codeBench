/**
 * UIEventHandler
 *
 * This module provides a UI event handling class that supports:
 * - Debouncing: To avoid processing every rapid-fire event.
 * - Throttling: To limit how often events are processed.
 * - Multi-event support: Allows handling multiple event types (e.g., click, mouseover).
 * - Heavy processing simulation: Mimics intensive work per event.
 *
 * Options:
 *   - debounceInterval: Number (ms) used for debouncing.
 *   - throttleInterval: Number (ms) used for throttling.
 *   - eventTypes: Array of strings representing event types to listen for.
 *   - heavyProcessingLoops: Number of loop iterations to simulate heavy processing.
 *
 * Methods:
 *   - attachEvents: Attaches event listeners to the provided element.
 *   - detachEvents: Removes event listeners and cancels pending timers.
 *   - simulateEvent: Manually trigger an event for testing purposes.
 *   - getEventCount: Returns the total count of processed events.
 *   - getEventLog: Returns an array of event log strings.
 *   - clearLog: Clears the event log.
 *   - resetCount: Resets the event counter to zero.
 */
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
    this.debounceTimers = {}; // One per event type.
    this.throttleTimers = {}; // One per event type.
    this.boundHandlers = {};

    // Bind a handler for each event type.
    this.options.eventTypes.forEach((type) => {
      this.boundHandlers[type] = this._createHandler(type);
    });
    this.attachEvents();
  }

  attachEvents() {
    this.options.eventTypes.forEach((type) => {
      this.element.addEventListener(type, this.boundHandlers[type]);
    });
  }

  detachEvents() {
    this.options.eventTypes.forEach((type) => {
      this.element.removeEventListener(type, this.boundHandlers[type]);
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
    /**
     * Creates an event handler that uses both debounce and throttle logic.
     * Note: The implementation intentionally processes events in two ways:
     * - Debounce: Processes the last event after a quiet period.
     * - Throttle: Processes the first event immediately and then blocks further processing.
     *
     * This combination can lead to duplicate processing if not handled correctly.
     */
    return (event) => {
      // DEBOUNCE: Clear any existing timer and set a new one.
      if (this.debounceTimers[eventType]) {
        clearTimeout(this.debounceTimers[eventType]);
      }
      this.debounceTimers[eventType] = setTimeout(() => {
        // Process event after debounce delay.
        this._processEvent(event, eventType, "debounce");
        delete this.debounceTimers[eventType];
      }, this.options.debounceInterval);

      // THROTTLE: If not already throttled, process immediately.
      if (!this.throttleTimers[eventType]) {
        this._processEvent(event, eventType, "throttle");
        this.throttleTimers[eventType] = setTimeout(() => {
          delete this.throttleTimers[eventType];
        }, this.options.throttleInterval);
      }
    };
  }

  _processEvent(event, eventType, method) {
    /**
     * Processes the event by incrementing counters, logging the event,
     * and simulating heavy processing.
     * The "method" parameter indicates whether this call is triggered via
     * debounce or throttle logic. (This might be used for debugging.)
     */
    this.eventCount++;
    const timestamp = Date.now();
    this.eventLog.push(
      `${eventType} event processed at ${timestamp} via ${method}`
    );
    // Simulate heavy processing work.
    for (let i = 0; i < this.options.heavyProcessingLoops; i++) {
      Math.sqrt(i);
    }
  }

  /**
   * simulateEvent
   * Manually triggers the event handler for a given event type.
   * This is useful for testing purposes.
   */
  simulateEvent(eventType, event = { type: eventType }) {
    if (this.boundHandlers[eventType]) {
      this.boundHandlers[eventType](event);
    }
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

module.exports = UIEventHandler;
