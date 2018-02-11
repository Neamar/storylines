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

  function getFooEqualBarState(value) {
    return {
      foo: value || "bar"
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
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();

        expect(() => stubStoryline.resolveStatePath(buildState(['missing', 'foo']), true)).toThrow(/Trying to access non-existing path/i);
      });

      it("should stop with current situation when throwOnMissing is false", () => {
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();

        expect(stubStoryline.resolveValue(buildState(['global', 'foo']))).toEqual("bar");
      });

      it("should resolve invalid state access (last level) to undefined", () => {
        stubStoryline.state.global = getFooEqualBarState();

        expect(stubStoryline.resolveValue(buildState(['global', 'fizz']))).toBeUndefined();
      });

      it("should resolve invalid state access (before last level) to undefined", () => {
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'fizz']),
          operator: '=',
          rhs: 'buzz'
        });

        expect(stubStoryline.state).toHaveProperty('global.fizz', "buzz");
      });

      it("should work on += operator", () => {
        stubStoryline.state.global = getFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '+=',
          rhs: 'baz'
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', "barbaz");
      });

      it("should fail on += operator when accessing non existing final value", () => {
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '-=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 8);
      });

      it("should fail on -= operator when accessing non existing final value", () => {
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '*=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 20);
      });

      it("should work on /= operator", () => {
        stubStoryline.state.global = getFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '/=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 5);
      });

      it("should work on %= operator", () => {
        stubStoryline.state.global = getFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: buildState(['global', 'foo']),
          operator: '%=',
          rhs: 7
        });

        expect(stubStoryline.state).toHaveProperty('global.foo', 3);
      });

      it("should fail on unknown operator", () => {
        stubStoryline.state.global = getFooEqualBarState();

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
        stubStoryline.state.global = getFooEqualBarState();
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

    describe("testAtomicCondition()", () => {
      it("should return false on any operator when missing a value", () => {
        stubStoryline.state.global = getFooEqualBarState();

        function deferred() {
          stubStoryline.testAtomicCondition({
            _type: "atomic_condition",
            lhs: buildState(['g', 'fizz']),
            operator: '==',
            rhs: 'bar'
          });
        }
        expect(deferred()).toBeFalsy();
      });

      it("should apply == operator", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: true,
          operator: "==",
          rhs: true
        })).toBeTruthy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: true,
          operator: "==",
          rhs: false
        })).toBeFalsy();
      });

      it("should apply strict equality rules", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 1,
          operator: "==",
          rhs: "1"
        })).toBeFalsy();
      });

      it("should apply > operator", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 1,
          operator: ">",
          rhs: 0
        })).toBeTruthy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: ">",
          rhs: 1
        })).toBeFalsy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: ">",
          rhs: 0
        })).toBeFalsy();
      });

      it("should apply >= operator", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 1,
          operator: ">=",
          rhs: 0
        })).toBeTruthy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: ">=",
          rhs: 1
        })).toBeFalsy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: ">=",
          rhs: 0
        })).toBeTruthy();
      });

      it("should apply < operator", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: "<",
          rhs: 1
        })).toBeTruthy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 1,
          operator: "<",
          rhs: 0
        })).toBeFalsy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: "<",
          rhs: 0
        })).toBeFalsy();
      });

      it("should apply >= operator", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: "<=",
          rhs: 1
        })).toBeTruthy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 1,
          operator: "<=",
          rhs: 0
        })).toBeFalsy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 0,
          operator: "<=",
          rhs: 0
        })).toBeTruthy();
      });

      it("should apply != operator", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: true,
          operator: "!=",
          rhs: false
        })).toBeTruthy();

        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: true,
          operator: "!=",
          rhs: true
        })).toBeFalsy();
      });

      it("should apply strict difference rules", () => {
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: 1,
          operator: "!=",
          rhs: "1"
        })).toBeTruthy();
      });

      it("should work with state access", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testAtomicCondition({
          _type: "atomic_condition",
          lhs: buildState(['global', 'foo']),
          operator: "==",
          rhs: "bar"
        })).toBeTruthy();
      });

      it("should fail on unknown operator", () => {
        function deferred() {
          stubStoryline.testAtomicCondition({
            _type: "atomic_condition",
            lhs: true,
            operator: '===',
            rhs: true
          });
        }

        expect(deferred).toThrow(/Invalid operator ===/i);
      });
    });

    describe("testPropositionalCondition()", () => {
      it("should return true when using AND and all conditions pass", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testPropositionalCondition({
          _type: "propositional_condition",
          boolean_operator: "AND",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "bar"
            },
            {
              _type: "atomic_condition",
              lhs: true,
              operator: "==",
              rhs: true
            }
        ]})).toBeTruthy();
      });

      it("should return false when using AND and one condition fails", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testPropositionalCondition({
          _type: "propositional_condition",
          boolean_operator: "AND",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "bar"
            },
            {
              _type: "atomic_condition",
              lhs: true,
              operator: "==",
              rhs: false
            }
        ]})).toBeFalsy();
      });

      it("should return true when using OR and at least one condition passes", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testPropositionalCondition({
          _type: "propositional_condition",
          boolean_operator: "OR",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "nope"
            },
            {
              _type: "atomic_condition",
              lhs: true,
              operator: "==",
              rhs: true
            }
        ]})).toBeTruthy();
      });

      it("should return true when using OR and all conditions pass", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testPropositionalCondition({
          _type: "propositional_condition",
          boolean_operator: "OR",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "bar"
            },
            {
              _type: "atomic_condition",
              lhs: true,
              operator: "==",
              rhs: true
            }
        ]})).toBeTruthy();
      });

      it("should return false when using OR and all conditions fails", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testPropositionalCondition({
          _type: "propositional_condition",
          boolean_operator: "OR",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "nope"
            },
            {
              _type: "atomic_condition",
              lhs: true,
              operator: "==",
              rhs: false
            }
        ]})).toBeFalsy();
      });
    });

    describe("testCondition()", () => {
      it("should recursively evaluate conditions (to true)", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testCondition({
          _type: "propositional_condition",
          boolean_operator: "AND",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "bar"
            },
            {
              _type: "propositional_condition",
              boolean_operator: "OR",
              conditions: [{
                _type: "atomic_condition",
                lhs: true,
                operator: "==",
                rhs: true
              }]
            }
        ]})).toBeTruthy();
      });

      it("should recursively evaluate conditions (to false)", () => {
        stubStoryline.state.global = getFooEqualBarState();
        expect(stubStoryline.testCondition({
          _type: "propositional_condition",
          boolean_operator: "AND",
          conditions: [
            {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "bar"
            },
            {
              _type: "propositional_condition",
              boolean_operator: "OR",
              conditions: [{
                _type: "atomic_condition",
                lhs: true,
                operator: "==",
                rhs: false
              }]
            }
        ]})).toBeFalsy();
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
        stubStoryline.state.global = getFooEqualBarState();

        stubStoryline.events = [
          {
            id: 1,
            triggers: {
              soft: {
                condition: {
                  _type: "atomic_condition",
                  lhs: true,
                  operator: "==",
                  rhs: true
                },
                weight: 1
              }
            }
          },
          {
            id: 2,
            triggers: {
              soft: {
                condition: {
                  _type: "atomic_condition",
                  lhs: "bar",
                  operator: "==",
                  rhs: buildState(["global", "foo"])
                },
                weight: 1
              }
            }
          },
          {
            id: 3,
            triggers: {
              soft: {
                condition: {
                  _type: "atomic_condition",
                  lhs: true,
                  operator: "==",
                  rhs: false
                },
                weight: 1
              }
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

  describe("respondToEvent()", () => {
    it("should ensure selected action is available", () => {
      stubStoryline.currentEvent = {
        actions: {}
      };

      expect(() => stubStoryline.respondToEvent("FAKEACTION")).toThrow(/Action FAKEACTION is not available/i);
    });

    it("should apply operations for specified actions", () => {
      stubStoryline.currentEvent = {
        actions: {
          "OK": {
            operations: [
              {
                lhs: buildState(["global", "action_ok"]),
                operator: "=",
                rhs: true
              }
            ]
          }
        }
      };

      stubStoryline.nextEvent = jest.fn();
      stubStoryline.respondToEvent("OK");
      expect(stubStoryline.state).toHaveProperty("global.action_ok", true);
    });

    it("should call nextEvent()", () => {
      stubStoryline.currentEvent = {
        actions: {
          "OK": {
            operations: []
          }
        }
      };

      stubStoryline.nextEvent = jest.fn();
      stubStoryline.respondToEvent("OK");
      expect(stubStoryline.nextEvent.mock.calls.length).toBe(1);
    });
  });

  describe("moveToEvent()", () => {
    it("should save event in currentEvent", () => {
      var event = {
        id: 1,
        on_display: [],
      };
      stubStoryline.moveToEvent(event);

      expect(stubStoryline.currentEvent).toBe(event);
    });

    it("should notify displayEvent callback", () => {
      stubStoryline.callbacks.displayEvent = jest.fn();

      var event = {
        id: 1,
        on_display: [],
        actions: {
          "OK": {}
        }
      };
      stubStoryline.moveToEvent(event);

      expect(stubStoryline.callbacks.displayEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.callbacks.displayEvent.mock.calls[0][0]).toBe(event.description);
      expect(stubStoryline.callbacks.displayEvent.mock.calls[0][1]).toEqual(["OK"]);
    });

    it("should apply on_display operations", () => {
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

    it("should filter actions depending on conditions", () => {
      stubStoryline.state.global = getFooEqualBarState();

      stubStoryline.callbacks.displayEvent = jest.fn();

      var event = {
        id: 1,
        on_display: [],
        actions: {
          "OK": {
            condition: {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "bar"
            }
          },
          "NOTOK": {
            condition: {
              _type: "atomic_condition",
              lhs: buildState(['global', 'foo']),
              operator: "==",
              rhs: "notok"
            }
          },
          "ALWAYS": {}
        }
      };

      stubStoryline.moveToEvent(event);

      expect(stubStoryline.callbacks.displayEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.callbacks.displayEvent.mock.calls[0][1]).toEqual(["OK", "ALWAYS"]);
    });

    it("should store event in a Set if repeatable is false", () => {
      var event = {
        id: 1,
        on_display: [],
        story: "fake",
        event: "event-1",
        repeatable: false
      };

      stubStoryline.moveToEvent(event);
      expect(stubStoryline.state.viewed_events.has(stubStoryline.getEventSlug(event))).toBeTruthy();
    });

    it("should not store event if repeatable is true", () => {
      var event = {
        id: 1,
        on_display: [],
        story: "fake",
        event: "event-1",
        repeatable: true
      };

      stubStoryline.moveToEvent(event);
      expect(stubStoryline.state.viewed_events.entries).toHaveProperty('length', 0);
    });
  });

  describe("nextEvent()", () => {
    var simpleMatchingEvent = function(id, triggerType) {
      var event = {
        id: id,
        story: "fake",
        event: "event-" + id,
        triggers: {}
      };

      event.triggers[triggerType] = {
        condition: {
          _type: "atomic_condition",
          lhs: true,
          operator: "==",
          rhs: true
        },
        weight: 1
      };

      return event;
    };

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
          soft: {
            condition: {
              _type: "atomic_condition",
              lhs: buildState(["global", "no_events_available"]),
              operator: "==",
              rhs: true
            },
            weight: 1
          }
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
        simpleMatchingEvent(1, "soft"),
        simpleMatchingEvent(2, "hard"),
      ];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.moveToEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.moveToEvent.mock.calls[0][0]).toBe(stubStoryline.events[1]);
    });

    it("should increment current_turn counter", () => {
      stubStoryline.events = [
        simpleMatchingEvent(1, "soft"),
      ];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.state.global.current_turn).toBe(1);
    });

    it("should not set no_events_available when events are available", () => {
      stubStoryline.events = [
        simpleMatchingEvent(1, "soft"),
      ];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.state.global.no_events_available).toBeFalsy();
    });

    it("should return soft triggers when there is no matching hard triggers", () => {
      stubStoryline.events = [
        simpleMatchingEvent(1, "soft"),
      ];

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.moveToEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.moveToEvent.mock.calls[0][0]).toBe(stubStoryline.events[0]);
    });

    it("should skip events already displayed", () => {
      stubStoryline.events = [
        simpleMatchingEvent(1, "hard"),
        simpleMatchingEvent(2, "soft"),
      ];
      stubStoryline.state.viewed_events.add(stubStoryline.getEventSlug(stubStoryline.events[0]));

      stubStoryline.moveToEvent = jest.fn();

      stubStoryline.nextEvent();
      expect(stubStoryline.moveToEvent.mock.calls.length).toBe(1);
      expect(stubStoryline.moveToEvent.mock.calls[0][0]).toBe(stubStoryline.events[1]);
    });
  });

  describe("doEventLottery()", () => {
    function generateEventWithWeight(weight) {
      return {
        triggers: {
          soft: {
            weight: weight
          }
        }
      };
    }

    it("should do a lottery", () => {
      var events = [
        generateEventWithWeight(1),
        generateEventWithWeight(1),
      ];

      stubStoryline.random = () => 0;
      expect(stubStoryline.doEventLottery(events)).toBe(events[0]);
    });

    it("should work with only one event", () => {
      var events = [
        generateEventWithWeight(1),
      ];

      stubStoryline.random = () => 0;
      expect(stubStoryline.doEventLottery(events)).toBe(events[0]);
    });

    it("should do a lottery based on weights", () => {
      var events = [
        generateEventWithWeight(1),
        generateEventWithWeight(10),
      ];

      stubStoryline.random = () => 0.5;
      expect(stubStoryline.doEventLottery(events)).toBe(events[1]);

      events = [
        generateEventWithWeight(1),
        generateEventWithWeight(10),
        generateEventWithWeight(1),
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
