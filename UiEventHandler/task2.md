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
        autoAttach: true,
      },
      options
    );
    this.eventCount = 0;
    this.eventLog = [];
    this.debounceTimers = {};
    this.throttleTimers = {};
    this.boundHandlers = {};
    this.destroyed = false;

    if (this.options.eventTypes.length > 0) {
      const type = this.options.eventTypes[0];
      this.boundHandlers[type] = this._createHandler(type);
      if (this.options.autoAttach) {
        this.attachEvents();
      }
    }
  }

  attachEvents() {
    const type = this.options.eventTypes[0];
    this.element.addEventListener(type, this.boundHandlers[type]);
  }

  detachEvents() {
    this.options.eventTypes.forEach((type) => {
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

  updateOptions(newOptions) {
    this.options = Object.assign({}, this.options, newOptions);
  }

  destroy() {
    this.detachEvents();
    this.eventLog = [];
    this.eventCount = 0;
    this.destroyed = true;
  }

  _createHandler(eventType) {
    return (event) => {
      this.debounceTimers[eventType] = setTimeout(() => {
        this._processEvent(event, eventType, "debounce");
      }, this.options.debounceInterval);

      this._processEvent(event, eventType, "throttle");
      this.throttleTimers[eventType] = setTimeout(() => {
        this._processEvent(event, eventType, "throttle-repeat");
      }, this.options.throttleInterval);
    };
  }

  _processEvent(event, eventType, method) {
    this.eventCount++;
    const timestamp = Date.now();
    const loggedType = this.options.eventTypes[0];
    this.eventLog.push(
      `${loggedType} event processed at ${timestamp} via ${method}`
    );
    for (let i = 0; i < 200000; i++) {
      Math.sqrt(i);
    }
    if (event.type === "dblclick") {
      throw new Error("dblclick events are not supported");
    }
  }

  simulateEvent(eventType, event = { type: eventType }) {
    if (!this.options.eventTypes.includes(eventType)) {
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
    this.eventLog = this.eventLog.slice(0, 1);
  }

  resetCount() {
  }
}

module.exports = {UIEventHandler};
```


Stack trace:
```javascript
  FAIL  ./UIEventHandler.test.js (35.389 s)
  UIEventHandler
    √ should process a single 'click' event correctly (211 ms)   
    × should debounce high-frequency 'click' events (771 ms)     
    × should throttle events such that rapid events do not over-process (230 ms)                                                  
    × should handle multiple event types independently (215 ms)
    × should not process events after detachEvents is called (210 ms)                                                             
    × should clear event log and reset count using clearLog and resetCount (227 ms)                                               
    × simulateEvent should manually trigger an event (98 ms)
    √ simulateEvent should throw for unsupported event types (5 ms)                                                               
    √ should process no events if none are triggered (3 ms)
    √ should override default options via constructor (212 ms)   
    × updateOptions should update intervals but not eventTypes (8 ms)                                                             
    √ destroy should clear all state and mark handler as destroyed (225 ms)                                                       
    √ stress test: process a large batch of events efficiently (26483 ms)                                                         
    × should process events from multiple types in a stress scenario (5331 ms)                                                    

  ● UIEventHandler › should debounce high-frequency 'click' events                                                                

    expect(received).toBe(expected) // Object.is equality        

    Expected: 2
    Received: 10

      71 |     // For correct behavior, only one immediate throttle call and one debounce call should occur.
      72 |     // Expected count: 2.
    > 73 |     expect(handler.getEventCount()).toBe(2);
         |                                     ^
      74 |   });
      75 |
      76 |   test("should throttle events such that rapid events do not over-process", () => {

      at Object.toBe (UIEventHandler.test.js:73:37)

  ● UIEventHandler › should throttle events such that rapid events do not over-process

    expect(received).toBe(expected) // Object.is equality        

    Expected: 2
    Received: 3

      87 |     element.listeners["click"].forEach((fn) => fn({ type: "click" }));
      88 |     // one immediate throttle call and one debounce call.
    > 89 |     expect(handler.getEventCount()).toBe(2);
         |                                     ^
      90 |     jest.advanceTimersByTime(210);
      91 |     expect(handler.getEventCount()).toBe(2);
      92 |   });

      at Object.toBe (UIEventHandler.test.js:89:37)

  ● UIEventHandler › should handle multiple event types independently

    expect(received).toBe(expected) // Object.is equality        

    Expected: 3
    Received: 2

      108 |     jest.advanceTimersByTime(101);
      109 |     // each event type processes once.
    > 110 |     expect(handler.getEventCount()).toBe(3);
          |                                     ^
      111 |     const logs = handler.getEventLog();
      112 |     expect(logs.some((l) => l.startsWith("click"))).toBe(true);
      113 |     expect(logs.some((l) => l.startsWith("mouseover"))).toBe(true);

      at Object.toBe (UIEventHandler.test.js:110:37)

  ● UIEventHandler › should not process events after detachEvents is called

    expect(received).toBe(expected) // Object.is equality        

    Expected: 0
    Received: 2

      126 |     }
      127 |     jest.advanceTimersByTime(150);
    > 128 |     expect(handler.getEventCount()).toBe(0);
          |                                     ^
      129 |   });
      130 |
      131 |   test("should clear event log and reset count using clearLog and resetCount", () => {

      at Object.toBe (UIEventHandler.test.js:128:37)

  ● UIEventHandler › should clear event log and reset count using clearLog and resetCount

    expect(received).toBe(expected) // Object.is equality        

    Expected: 0
    Received: 2

      141 |     handler.clearLog();
      142 |     handler.resetCount();
    > 143 |     expect(handler.getEventCount()).toBe(0);
          |                                     ^
      144 |     expect(handler.getEventLog().length).toBe(0);    
      145 |   });
      146 |

      at Object.toBe (UIEventHandler.test.js:143:37)

  ● UIEventHandler › simulateEvent should manually trigger an event

    dblclick events are not supported

      81 |     }
      82 |     if (event.type === "dblclick") {
    > 83 |       throw new Error("dblclick events are not supported");
         |             ^
      84 |     }
      85 |   }
      86 |

      at UIEventHandler._processEvent (solution.js:83:13)        
      at Object._processEvent [as click] (solution.js:65:12)     
      at UIEventHandler.simulateEvent (solution.js:92:53)        
      at Object.simulateEvent (UIEventHandler.test.js:153:13)    

  ● UIEventHandler › updateOptions should update intervals but not eventTypes

    expect(received).toEqual(expected) // deep equality

    - Expected  - 2
    + Received  + 1

      Array [
    -   "click",
    -   "mouseover",
    +   "keydown",
      ]

      208 |     expect(handler.options.throttleInterval).toBe(120);
      209 |     // Event types remain unchanged.
    > 210 |     expect(handler.options.eventTypes).toEqual(["click", "mouseover"]);
          |                                        ^
      211 |     // Simulate a click event.
      212 |     element.listeners["click"].forEach((fn) => fn({ type: "click" }));
      213 |     jest.advanceTimersByTime(81);

      at Object.toEqual (UIEventHandler.test.js:210:40)

  ● UIEventHandler › should process events from multiple types in a stress scenario

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 1
    Received:    0

      269 |     expect(
      270 |       log.filter((l) => l.startsWith("mouseover")).length
    > 271 |     ).toBeGreaterThanOrEqual(1);
          |       ^
      272 |     expect(
      273 |       log.filter((l) => l.startsWith("keydown")).length
      274 |     ).toBeGreaterThanOrEqual(1);

      at Object.toBeGreaterThanOrEqual (UIEventHandler.test.js:271:7)

Test Suites: 1 failed, 1 total                                   
Tests:       8 failed, 6 passed, 14 total                        
Snapshots:   0 total
Time:        35.576 s
Ran all test suites.
```
Prompt;
This `UIEventHandler` class is crashing because of the bugs present, as seen in the stack trace above, please help me fix the code to make it function properly


Fix the UIEventHandler class to handle events correctly by adding and removing listeners, managing timers per event type, preventing duplicate throttling, logging events properly, supporting simulation, validating event types, implementing utility methods, resetting state, using user options, and cleaning up listeners safely.




Fix the UIEventHandler class to handle events correctly by adding and removing listeners, managing timers per event type, preventing duplicate throttling, logging events properly, supporting simulation, validating event types, implementing utility methods, resetting state, using user options, and cleaning up listeners safely.