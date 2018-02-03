"use strict";
const Storylines = require('../../frontend/storylines.js');


describe("Storylines", () => {
  function buildState(state) {
    return {
      _type: "state",
      data: state
    };
  }

  var stubDisplayEvent = () => {};
  var stubDisplayResources = () => {};

  function getGlobalFooEqualBarState(value) {
    return {
      global: {
        foo: value || "bar"
      }
    };
  }

  var stubStoryline;

  beforeEach(() => {
    var stubStory = {
      events: [],
      resources: {
        'r': {}
      },
      story_title: 'title',
      story_description: 'description',
      default_state: {
        global: {
          current_turn: 0,
        }
      }
    };

    var stubCallbacks = {
      displayEvent: stubDisplayEvent,
      displayResources: stubDisplayResources,
    };

    stubStoryline = new Storylines(stubStory, stubCallbacks);
  });

  describe("Constructor", () => {
    it("should require a story parameter", () => {
      expect(() => new Storylines()).toThrow(/Story is required/i);
    });

    it("should require a callbacks parameter", () => {
      expect(() => new Storylines({})).toThrow(/Callbacks object is required/i);
    });

    it("should require a callbacks.displayEvent property", () => {
      expect(() => new Storylines({}, {})).toThrow(/Missing required callback: displayEvent/i);
    });

    it("should require a callbacks.displayResources property", () => {
      expect(() => new Storylines({}, {displayEvent: function() {}})).toThrow(/Missing required callback: displayResources/i);
    });
  });

  describe("Conditions and operations", () => {
    describe("resolveStatePath()", () => {
      it("should return parent object and key when statePath exists", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        var r = stubStoryline.resolveStatePath(buildState(['global', 'foo']));

        expect(r).toHaveProperty('parent', stubStoryline.state.global);
        expect(r).toHaveProperty('key', 'foo');
        expect(r).toHaveProperty('missing', false);
        expect(r).toHaveProperty('missingOnLastLevel', false);
      });

      it("should return parent object and key when statePath exists in nested access", () => {
        stubStoryline.state = {
          global: {
            foo: {
              bar: {
                fizz: "buzz"
              }}
          }
        };

        var r = stubStoryline.resolveStatePath(buildState(['global', 'foo', 'bar', 'fizz']));

        expect(r).toHaveProperty('parent', stubStoryline.state.global.foo.bar);
        expect(r).toHaveProperty('key', 'fizz');
        expect(r).toHaveProperty('missing', false);
        expect(r).toHaveProperty('missingOnLastLevel', false);
      });

      it("should throw when throwOnMissing is true", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        expect(() => stubStoryline.resolveStatePath(buildState(['missing', 'foo']), true)).toThrow(/Trying to access non-existing path/i);
      });

      it("should stop with current situation when throwOnMissing is false", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        var r = stubStoryline.resolveStatePath(buildState(['missing', 'foo']));

        expect(r).toHaveProperty('parent', stubStoryline.state);
        expect(r).toHaveProperty('key', 'missing');
        expect(r).toHaveProperty('missing', true);
        expect(r).toHaveProperty('missingOnLastLevel', false);
      });

      it("should indicate that value is missing on last level", () => {
        stubStoryline.state = {
          global: {
            foo: "bar"
          }
        };

        var r = stubStoryline.resolveStatePath(buildState(['global', 'fizz']));

        expect(r).toHaveProperty('parent', stubStoryline.state.global);
        expect(r).toHaveProperty('key', 'fizz');
        expect(r).toHaveProperty('missing', true);
        expect(r).toHaveProperty('missingOnLastLevel', true);
      });

      it("should throw when trying to access something that isn't a state path", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        expect(() => stubStoryline.resolveStatePath("something different")).toThrow(/Must be a state access/i);
      });
    });

    describe("resolveValue()", () => {
      it("should resolve standard types", () => {
        expect(stubStoryline.resolveValue(true)).toEqual(true);
        expect(stubStoryline.resolveValue(123)).toEqual(123);
        expect(stubStoryline.resolveValue("ABC")).toEqual("ABC");
        expect(stubStoryline.resolveValue([1, "A"])).toEqual([1, "A"]);
      });

      it("should resolve state access", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        expect(stubStoryline.resolveValue(buildState(['global', 'foo']))).toEqual("bar");
      });

      it("should resolve invalid state access (last level) to undefined", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        expect(stubStoryline.resolveValue(buildState(['global', 'fizz']))).toBeUndefined();
      });

      it("should resolve invalid state access (before last level) to undefined", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        expect(stubStoryline.resolveValue(buildState(['buzz', 'fizz']))).toBeUndefined();
      });
    });

    describe("isStateAccess()", () => {
      it("should return false for non state access", () => {
        expect(stubStoryline.isStateAccess("fake value")).toBeFalsy();
      });

      it("should return false for complex structures that are not state access", () => {
        expect(stubStoryline.isStateAccess({_type: "or_condition", data: []})).toBeFalsy();
      });

      it("should return true for state access", () => {
        expect(stubStoryline.isStateAccess({_type: "state", data: []})).toBeTruthy();
      });
    });

    describe("applyOperation()", () => {
      it("should fail on any operator when missing a value before the last one", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: buildState(['g', 'fizz']),
            operator: '=',
            rhs: 'buzz'
          });
        }
        expect(deferred).toThrow(/Trying to access non-existing path in state/i);
      });

      it("should work on = operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '=',
          rhs: 'baz'
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', "baz");
      });

      it("should work on = operator when rhs is a state access", () => {
        stubStoryline.state = {
          global: {
            foo: 1,
            bar: 2
          }
        };

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '=',
          rhs: buildState(['global', 'bar']),
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 2);
      });

      it("should work on = operator when creating a new value", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'fizz']),
          operator: '=',
          rhs: 'buzz'
        });

        expect(stubStoryline.state).toHaveProperty('global.fizz', "buzz");
      });

      it("should work on += operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '+=',
          rhs: 'baz'
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', "barbaz");
      });

      it("should fail on += operator when accessing non existing final value", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: buildState(['global', 'fizz']),
            operator: '+=',
            rhs: 'buzz'
          });
        }

        expect(deferred).toThrow(/Can't apply compound operator on undefined/i);
      });

      it("should work on += operator when rhs is a state access", () => {
        stubStoryline.state = {
          global: {
            foo: 1,
            bar: 2
          }
        };

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '+=',
          rhs: buildState(['global', 'bar']),
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 3);
      });

      it("should work on -= operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '-=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 8);
      });

      it("should fail on -= operator when accessing non existing final value", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: buildState(['global', 'fizz']),
            operator: '-=',
            rhs: 3
          });
        }

        expect(deferred).toThrow(/Can't apply compound operator on undefined/i);
      });

      it("should work on *= operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '*=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 20);
      });

      it("should work on /= operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '/=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 5);
      });

      it("should work on %= operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '%=',
          rhs: 7
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 3);
      });

      it("should fail on unknown operator", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: buildState(['global', 'foo']),
            operator: '&=',
            rhs: 3
          });
        }

        expect(deferred).toThrow(/Invalid operator &=/i);
      });
    });

    describe("applyOperations()", () => {
      it("should apply all operations", () => {
        stubStoryline.state = getGlobalFooEqualBarState();
        var operations = [
          {
            lhs: buildState(["global", "foo"]),
            operator: '+=',
            rhs: "baz"
          },
          {
            lhs: buildState(["global", "bar"]),
            operator: '=',
            rhs: "foo"
          },
        ];

        stubStoryline.applyOperations(operations);

        expect(stubStoryline.state).toHaveProperty("global.foo", "barbaz");
        expect(stubStoryline.state).toHaveProperty("global.bar", "foo");
      });

      it("should notify displayResources", () => {
        stubStoryline.callbacks.displayResources = jest.fn();
        var operations = [];

        stubStoryline.applyOperations(operations);

        expect(stubStoryline.callbacks.displayResources.mock.calls.length).toBe(1);
      });
    });

    describe("testCondition()", () => {
      it("should return false on any operator when missing a value", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        function deferred() {
          stubStoryline.testCondition({
            lhs: buildState(['g', 'fizz']),
            operator: '==',
            rhs: 'bar'
          });
        }
        expect(deferred()).toBeFalsy();
      });

      it("should apply == operator", () => {
        expect(stubStoryline.testCondition({
          lhs: true,
          operator: "==",
          rhs: true
        })).toBeTruthy();

        expect(stubStoryline.testCondition({
          lhs: true,
          operator: "==",
          rhs: false
        })).toBeFalsy();
      });

      it("should apply strict equality rules", () => {
        expect(stubStoryline.testCondition({
          lhs: 1,
          operator: "==",
          rhs: "1"
        })).toBeFalsy();
      });

      it("should apply > operator", () => {
        expect(stubStoryline.testCondition({
          lhs: 1,
          operator: ">",
          rhs: 0
        })).toBeTruthy();

        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: ">",
          rhs: 1
        })).toBeFalsy();

        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: ">",
          rhs: 0
        })).toBeFalsy();
      });

      it("should apply >= operator", () => {
        expect(stubStoryline.testCondition({
          lhs: 1,
          operator: ">=",
          rhs: 0
        })).toBeTruthy();

        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: ">=",
          rhs: 1
        })).toBeFalsy();

        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: ">=",
          rhs: 0
        })).toBeTruthy();
      });

      it("should apply < operator", () => {
        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: "<",
          rhs: 1
        })).toBeTruthy();

        expect(stubStoryline.testCondition({
          lhs: 1,
          operator: "<",
          rhs: 0
        })).toBeFalsy();

        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: "<",
          rhs: 0
        })).toBeFalsy();
      });

      it("should apply >= operator", () => {
        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: "<=",
          rhs: 1
        })).toBeTruthy();

        expect(stubStoryline.testCondition({
          lhs: 1,
          operator: "<=",
          rhs: 0
        })).toBeFalsy();

        expect(stubStoryline.testCondition({
          lhs: 0,
          operator: "<=",
          rhs: 0
        })).toBeTruthy();
      });

      it("should apply != operator", () => {
        expect(stubStoryline.testCondition({
          lhs: true,
          operator: "!=",
          rhs: false
        })).toBeTruthy();

        expect(stubStoryline.testCondition({
          lhs: true,
          operator: "!=",
          rhs: true
        })).toBeFalsy();
      });

      it("should apply strict difference rules", () => {
        expect(stubStoryline.testCondition({
          lhs: 1,
          operator: "!=",
          rhs: "1"
        })).toBeTruthy();
      });

      it("should work with state access", () => {
        stubStoryline.state = getGlobalFooEqualBarState();
        expect(stubStoryline.testCondition({
          lhs: buildState(['global', 'foo']),
          operator: "==",
          rhs: "bar"
        })).toBeTruthy();
      });

      it("should fail on unknown operator", () => {
        function deferred() {
          stubStoryline.testCondition({
            lhs: true,
            operator: '===',
            rhs: true
          });
        }

        expect(deferred).toThrow(/Invalid operator ===/i);
      });
    });

    describe("testConditions()", () => {
      it("should return true if all conditions pass", () => {
        stubStoryline.state = getGlobalFooEqualBarState();
        expect(stubStoryline.testConditions([
          {
            lhs: buildState(['global', 'foo']),
            operator: "==",
            rhs: "bar"
          },
          {
            lhs: true,
            operator: "==",
            rhs: true
          }
        ])).toBeTruthy();
      });
      it("should return false if one condition fails", () => {
        stubStoryline.state = getGlobalFooEqualBarState();
        expect(stubStoryline.testConditions([
          {
            lhs: buildState(['global', 'foo']),
            operator: "==",
            rhs: "bar"
          },
          {
            lhs: true,
            operator: "==",
            rhs: false
          }
        ])).toBeFalsy();
      });
    });
  });

  describe("Event listing", () => {
    describe("listAvailableEvents()", () => {
      it("should skip events without the specified trigger", () => {
        stubStoryline.events = [{
          id: 1,
          triggers: {}
        }];

        expect(stubStoryline.listAvailableEvents("fake")).toEqual([]);
      });

      it("should return all matching events", () => {
        stubStoryline.state = getGlobalFooEqualBarState();

        stubStoryline.events = [
          {
            id: 1,
            triggers: {
              soft: [
                {lhs: true, operator: "==", rhs: true}
              ]
            }
          },
          {
            id: 2,
            triggers: {
              soft: [
                {lhs: "bar", operator: "==", rhs: buildState(["global", "foo"])}
              ]
            }
          },
          {
            id: 3,
            triggers: {
              soft: [
                {lhs: true, operator: "==", rhs: false}
              ]
            }
          }
        ];
        expect(stubStoryline.listAvailableEvents("soft")).toEqual([stubStoryline.events[0], stubStoryline.events[1]]);
      });
    });

    describe("listAvailableHardEvents()", () => {
      it("should call listAvailableEvents('hard')", () => {
        stubStoryline.listAvailableEvents = jest.fn();

        stubStoryline.listAvailableHardEvents();

        expect(stubStoryline.listAvailableEvents.mock.calls.length).toBe(1);
        expect(stubStoryline.listAvailableEvents.mock.calls[0][0]).toBe('hard');
      });
    });

    describe("listAvailableSoftEvents()", () => {
      it("should call listAvailableEvents('soft')", () => {
        stubStoryline.listAvailableEvents = jest.fn();

        stubStoryline.listAvailableSoftEvents();

        expect(stubStoryline.listAvailableEvents.mock.calls.length).toBe(1);
        expect(stubStoryline.listAvailableEvents.mock.calls[0][0]).toBe('soft');
      });
    });
  });

  describe("start()", () => {
    it("should call nextEvent by default", () => {
      stubStoryline.nextEvent = jest.fn();

      stubStoryline.start();

      expect(stubStoryline.nextEvent.mock.calls.length).toBe(1);
    });

    it("should throw if story is already started", () => {
      stubStoryline.nextEvent = jest.fn();

      stubStoryline.start();
      expect(stubStoryline.nextEvent.mock.calls.length).toBe(1);

      stubStoryline.currentEvent = {};
      expect(() => stubStoryline.start()).toThrow(/Storyline already started/i);
      // Call count shouldn't change
      expect(stubStoryline.nextEvent.mock.calls.length).toBe(1);

    });
  });

  describe("moveToEvent()", () => {
    it("should save event in currentEvent", () => {
      var event = {id: 1};
      stubStoryline.moveToEvent(event);

      expect(stubStoryline.currentEvent).toBe(event);
    });

    it("should notify displayEvent callback", () => {
      stubStoryline.callbacks.displayEvent = jest.fn();

      var event = {id: 1};
      stubStoryline.moveToEvent(event);

      expect(stubStoryline.callbacks.displayEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.callbacks.displayEvent.mock.calls[0][0]).toBe(event);
    });

    it("should apply on_display operations if specified", () => {
      var event = {id: 1, on_display: [
        {
          lhs: buildState(['global', 'on_display']),
          operator: '=',
          rhs: true
        }
      ]};

      stubStoryline.moveToEvent(event);

      expect(stubStoryline.state).toHaveProperty('global.on_display', true);
    });
  });

  describe("nextEvent()", () => {
    it("should throw when no events are available", () => {
      stubStoryline.events = [];

      expect(() => stubStoryline.nextEvent()).toThrow(/No more events available/i);
      expect(stubStoryline.state.global.current_turn).toBe(1);
      expect(stubStoryline.state.global.no_events_available).toBeTruthy();
    });

    it("should set no_events_available when no events are available, and search for a new event", () => {
      stubStoryline.events = [{
        id: 1,
        triggers: {
          soft: [
            {
              lhs: buildState(["global", "no_events_available"]),
              operator: "==",
              rhs: true
            }
          ]
        }
      }];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.moveToEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.moveToEvent.mock.calls[0][0]).toBe(stubStoryline.events[0]);
      expect(stubStoryline.state.global.current_turn).toBe(1);
      expect(stubStoryline.state.global.no_events_available).toBeTruthy();
    });

    it("should return hard triggers before soft triggers", () => {
      stubStoryline.events = [
      {
        id: 1,
        triggers: {
          soft: [
            {
              lhs: true,
              operator: "==",
              rhs: true
            }
          ]
        }
      },
      {
        id: 2,
        triggers: {
          hard: [
            {
              lhs: true,
              operator: "==",
              rhs: true
            }
          ]
        }
      }];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.moveToEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.moveToEvent.mock.calls[0][0]).toBe(stubStoryline.events[1]);
      expect(stubStoryline.state.global.current_turn).toBe(1);
      expect(stubStoryline.state.global.no_events_available).toBeFalsy();
    });

    it("should return soft triggers when there is no matching hard triggers", () => {
      stubStoryline.events = [
      {
        id: 1,
        triggers: {
          soft: [
            {
              lhs: true,
              operator: "==",
              rhs: true
            }
          ]
        }
      }];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.moveToEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.moveToEvent.mock.calls[0][0]).toBe(stubStoryline.events[0]);
      expect(stubStoryline.state.global.current_turn).toBe(1);
      expect(stubStoryline.state.global.no_events_available).toBeFalsy();
    });
  });

  describe("doEventLottery()", () => {
    it("should do a lottery", () => {
      var events = [
        {weight: 1},
        {weight: 1},
      ];

      stubStoryline.random = () => 0;
      expect(stubStoryline.doEventLottery(events)).toBe(events[0]);
    });

    it("should work with only one event", () => {
      var events = [
        {weight: 1},
      ];

      stubStoryline.random = () => 0;
      expect(stubStoryline.doEventLottery(events)).toBe(events[0]);
    });

    it("should do a lottery based on weights", () => {
      var events = [
        {weight: 1},
        {weight: 10},
      ];

      stubStoryline.random = () => 0.5;
      expect(stubStoryline.doEventLottery(events)).toBe(events[1]);

      events = [
        {weight: 1},
        {weight: 10},
        {weight: 1},
      ];

      stubStoryline.random = () => 0.5;
      expect(stubStoryline.doEventLottery(events)).toBe(events[1]);
      stubStoryline.random = () => 0;
      expect(stubStoryline.doEventLottery(events)).toBe(events[0]);
      stubStoryline.random = () => 0.99;
      expect(stubStoryline.doEventLottery(events)).toBe(events[2]);
    });
  });
});
