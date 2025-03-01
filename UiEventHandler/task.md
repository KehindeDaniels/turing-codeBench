Base code
```javascript
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
    return (event) => {
      if (this.debounceTimers[eventType]) {
        clearTimeout(this.debounceTimers[eventType]);
      }
      this.debounceTimers[eventType] = setTimeout(() => {
        this._processEvent(event, eventType, "debounce");
        delete this.debounceTimers[eventType];
      }, this.options.debounceInterval);

      if (!this.throttleTimers[eventType]) {
        this._processEvent(event, eventType, "throttle");
        this.throttleTimers[eventType] = setTimeout(() => {
          delete this.throttleTimers[eventType];
        }, this.options.throttleInterval);
      }
    };
  }

  _processEvent(event, eventType, method) {
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

```

Stack trace
```Javascript
 FAIL  ./UIEventHandler.test.js (8.387 s)
  UIEventHandler Comprehensive Test Suite
    × should process a single "click" event correctly (9 ms)     
    × should debounce high-frequency "click" events (4 ms)       
    × should throttle events such that rapid events do not over-process (1 ms)                                                    
    × should handle multiple event types independently (2 ms)
    × should not process event after detachEvents is called (2 ms)                                                                
    × should clear event log and reset count using clearLog and resetCount (1 ms)                                                 
    √ simulateEvent should manually trigger an event (85 ms)
    √ should handle unknown event types gracefully (3 ms)        
    √ should process no events if none are triggered (1 ms)      
    × should override default options via constructor (2 ms)     
    × stress test: process a large batch of events efficiently (2 ms)                                                             
    × should process events from multiple types in a stress scenario (1 ms)                                                       

  ● UIEventHandler Comprehensive Test Suite › should process a single "click" event correctly                                     

    TypeError: Cannot read properties of undefined (reading 'click')

      43 |     });
      44 |     // Simulate a click event.
    > 45 |     element.listeners.click({ type: "click" });       
         |                       ^
      46 |     jest.advanceTimersByTime(101);
      47 |     expect(handler.getEventCount()).toBeGreaterThanOrEqual(1);
      48 |     const log = handler.getEventLog();

      at Object.click (UIEventHandler.test.js:45:23)

  ● UIEventHandler Comprehensive Test Suite › should debounce high-frequency "click" events

    TypeError: Cannot read properties of undefined (reading 'click')

      60 |     // Fire 10 clicks in rapid succession.
      61 |     for (let i = 0; i < 10; i++) {
    > 62 |       element.listeners.click({ type: "click" });     
         |                         ^
      63 |     }
      64 |     // Advance less than debounce interval.
      65 |     jest.advanceTimersByTime(50);

      at Object.click (UIEventHandler.test.js:62:25)

  ● UIEventHandler Comprehensive Test Suite › should throttle events such that rapid events do not over-process

    TypeError: Cannot read properties of undefined (reading 'click')

      79 |     });
      80 |     // Fire an event, then another after 10ms, then another after 10ms...
    > 81 |     element.listeners.click({ type: "click" });       
         |                       ^
      82 |     jest.advanceTimersByTime(10);
      83 |     element.listeners.click({ type: "click" });       
      84 |     jest.advanceTimersByTime(10);

      at Object.click (UIEventHandler.test.js:81:23)

  ● UIEventHandler Comprehensive Test Suite › should handle multiple event types independently

    TypeError: Cannot read properties of undefined (reading 'click')

       99 |     });
      100 |     // Simulate a click event.
    > 101 |     element.listeners.click({ type: "click" });      
          |                       ^
      102 |     // Simulate a mouseover event.
      103 |     element.listeners.mouseover({ type: "mouseover" });
      104 |     // Advance timers sufficiently.

      at Object.click (UIEventHandler.test.js:101:23)

  ● UIEventHandler Comprehensive Test Suite › should not process event after detachEvents is called

    TypeError: Cannot read properties of undefined (reading 'click')

      119 |     handler.detachEvents();
      120 |     // Simulate a click event.
    > 121 |     if (element.listeners.click) {
          |                           ^
      122 |       element.listeners.click({ type: "click" });    
      123 |     }
      124 |     jest.advanceTimersByTime(150);

      at Object.click (UIEventHandler.test.js:121:27)

  ● UIEventHandler Comprehensive Test Suite › should clear event log and reset count using clearLog and resetCount

    TypeError: Cannot read properties of undefined (reading 'click')

      134 |     });
      135 |     // Simulate events.
    > 136 |     element.listeners.click({ type: "click" });      
          |                       ^
      137 |     jest.advanceTimersByTime(101);
      138 |     expect(handler.getEventCount()).toBeGreaterThan(0);
      139 |     expect(handler.getEventLog().length).toBeGreaterThan(0);

      at Object.click (UIEventHandler.test.js:136:23)

  ● UIEventHandler Comprehensive Test Suite › should override default options via constructor

    TypeError: Cannot read properties of undefined (reading 'mousemove')

      187 |       heavyProcessingLoops: 50000,
      188 |     });
    > 189 |     element.listeners.mousemove({ type: "mousemove" });
          |                       ^
      190 |     jest.advanceTimersByTime(51);
      191 |     expect(handler.getEventCount()).toBeGreaterThan(0);
      192 |     // Check that the event log contains "mousemove" 

      at Object.mousemove (UIEventHandler.test.js:189:23)        

  ● UIEventHandler Comprehensive Test Suite › stress test: process a large batch of events efficiently

    TypeError: Cannot read properties of undefined (reading 'click')

      204 |     // Simulate 100 rapid click events.
      205 |     for (let i = 0; i < 100; i++) {
    > 206 |       element.listeners.click({ type: "click" });    
          |                         ^
      207 |     }
      208 |     // Advance time in steps.
      209 |     jest.advanceTimersByTime(50);

      at Object.click (UIEventHandler.test.js:206:25)

  ● UIEventHandler Comprehensive Test Suite › should process events from multiple types in a stress scenario

    TypeError: Cannot read properties of undefined (reading 'click')

      223 |     // Fire a mixture of events rapidly.
      224 |     for (let i = 0; i < 30; i++) {
    > 225 |       element.listeners.click({ type: "click" });    
          |                         ^
      226 |       element.listeners.mouseover({ type: "mouseover" });
      227 |       element.listeners.keydown({ type: "keydown" });
      228 |     }

      at Object.click (UIEventHandler.test.js:225:25)

Test Suites: 1 failed, 1 total                                   
Tests:       9 failed, 3 passed, 12 total                        
Snapshots:   0 total
Time:        10.598 s
Ran all test suites.

```

Prompt:
This UiEventHandler has many bugs that is causing the tests to fail. Please fix the bugs 

- Fix undefined event listeners in fake element setup
- Make single click events process correctly
- Fix rapid click debouncing to process one immediate and one after quiet period
- Fix throttling to prevent over-processing of events
- Make different event types process independently
- Make event detachment stop all processing
- Make clear/reset methods fully reset state
- Apply custom options correctly
- Handle large event batches efficiently
- Process multiple event types correctly in stress tests