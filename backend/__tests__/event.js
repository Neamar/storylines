"use strict";
const event = require('../event'); // jshint ignore:line

describe("event file", () => {
  function getBasicEvent() {
    return {
      description: "Description",
      event: 'event_slug',
      storyline: 'storyline_slug',
      repeatable: false,
      on_display: [],
    };
  }

  describe("readEvent()", () => {
    test('should read event from disk', () => {
      var r = event.readEvent(__dirname + '/mocks/storylines', 'test_storyline_1', 'event_1_1');

      expect(r).toContain("triggers");
      expect(r).toContain("g.test");
      expect(r).toContain("---");
    });

    test('should read event from disk', () => {
      var r = event.readEvent(__dirname + '/mocks/storylines', 'test_storyline_2', 'event_2_1');

      expect(r).toContain("triggers");
      expect(r).toContain("g.test");
      expect(r).toContain("---");
    });
  });

  describe("buildEvent()", function() {
    test("should fail on invalid event", () => {
      expect(() => event.buildEvent('FAKE', 's', 'e')).toThrow(/valid FrontMatter/);
    });

    test("should transform front matter content to a JavaScript object", () => {
      var e = event.buildEvent(`---
triggers:
    soft:
        conditions:
            - g.test == true
---
TEST
`, 'storyline_slug', 'event_slug');

      expect(e).toHaveProperty('description', 'TEST');
      expect(e).toHaveProperty('event', 'event_slug');
      expect(e).toHaveProperty('storyline', 'storyline_slug');
      expect(e).toHaveProperty('triggers.soft.conditions.0', 'g.test == true');
      expect(e).toHaveProperty('repeatable', false);
      expect(e).toHaveProperty('on_display', []);
    });
  });

  describe("validateEvent()", function() {

    test('should ensure storyline slug is present', () => {
      expect(() => event.validateEvent({})).toThrow(/Missing storyline slug/i);
    });

    test('should ensure storyline is a slug', () => {
      expect(() => event.validateEvent({storyline: 'not a slug'})).toThrow(/storyline should be of type 'slug', not 'string'/i);
    });

    test('should ensure event slug is present', () => {
      expect(() => event.validateEvent({storyline: 'storyline_slug'})).toThrow(/Missing event/i);
    });

    test('should ensure event is a slug', () => {
      expect(() => event.validateEvent({storyline: 'storyline_slug', event: 'not a slug'})).toThrow(/event should be of type 'slug', not 'string'/i);
    });

    test('should ensure description is present', () => {
      expect(() => event.validateEvent({event: 'event_slug', storyline: 'storyline_slug'})).toThrow(/Missing event description/i);
    });

    test('should work with the most basic event', () => {
      expect(event.validateEvent(getBasicEvent())).toEqual(getBasicEvent());
    });

    describe("Trigger validation", () => {
      test('should ensure triggers is an object', () => {
        var e = getBasicEvent();
        e.triggers = [];

        expect(() => event.validateEvent(e)).toThrow(/triggers should be of type 'object', not 'array'/i);
      });
      test('should ensure triggers only contain hard or soft constraints', () => {
        var e = getBasicEvent();
        e.triggers = {
          nonexisting: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Triggers cannot be 'nonexisting'. Possible types are: hard, soft/i);
      });

      test('should ensure hard triggers have a conditions property', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Triggers must include conditions/i);
      });

      test('should ensure hard triggers weight property is numeric', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {
            conditions: "",
            weight: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/weight should be of type 'number', not 'boolean'/i);
      });

      test('should accept hard triggers weight numeric property', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {
            conditions: "",
            weight: 15
          }
        };

        expect(event.validateEvent(e)).toHaveProperty('triggers.hard.weight', 15);
      });

      test('should ensure soft triggers have a conditions property', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Triggers must include conditions/i);
      });

      test('should ensure soft triggers weight property is numeric', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            conditions: "",
            weight: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/weight should be of type 'number', not 'boolean'/i);
      });

      test('should accept soft triggers weight numeric property', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            conditions: "",
            weight: 15
          }
        };

        expect(event.validateEvent(e)).toHaveProperty('triggers.soft.weight', 15);
      });
    });

    describe("Actions validation", () => {
      test('should ensure actions is an object', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            conditions: "",
            weight: 15
          }
        };
        e.actions = [];

        expect(() => event.validateEvent(e)).toThrow(/actions should be of type 'object', not 'array'/i);
      });

      test('should ensure actions contain an operations key', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            conditions: "",
            weight: 15
          }
        };
        e.actions = {
          OK: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Actions must include operations/i);
      });

      test('should ensure actions operations is an array', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/operations should be of type 'array', not 'boolean'/i);
      });

      test('should ensure actions conditions is an array', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: [],
            conditions: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/conditions should be of type 'array', not 'boolean'/i);
      });
    });
  });

  describe("on_display operations", () => {
    test('should accept empty on_display', () => {
      var e = getBasicEvent();
      expect(event.validateEvent(e)).toHaveProperty("event", e.event);
    });

    test('should ensure on_display is an array', () => {
      var e = getBasicEvent();
      e.on_display = {};

      expect(() => event.validateEvent(e)).toThrow(/on_display should be of type 'array', not 'object'/i);
    });
  });

  describe("parseEvent()", () => {
    describe("Trigger parsing", () => {
      test('should parse enclosed soft conditions', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            conditions: 'global.something == true',
            weight: 1,
          }
        };

        var expected = getBasicEvent();
        expected.triggers = {
          soft: {
            conditions: {
              lhs: {"_type": "state", "data": ['global', 'something']},
              operator: '==',
              rhs: true
            },
            weight: 1,
          }
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });

      test('should parse enclosed hard conditions', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {
            conditions: {
              'AND': [
                'global.something == true',
                'resources.foo >= 150'
              ]
            },
            weight: 1,
          }
        };

        var expected = getBasicEvent();
        expected.triggers = {
          hard: {
            conditions: {
              'AND': [
                {
                  lhs: {"_type": "state", "data": ['global', 'something']},
                  operator: '==',
                  rhs: true
                },
                {
                  lhs: {"_type": "state", "data": ['resources', 'foo']},
                  operator: '>=',
                  rhs: 150
                },
              ]
            },
            weight: 1,
          }
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });

      test('should replace shorthands', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            conditions: {
              "AND": [
                'sl.something == true',
                'r.foo >= 150'
              ],
            },
            weight: 1,
          }
        };

        var expected = getBasicEvent();
        expected.triggers = {
          soft: {
            conditions: {
              "AND": [
                {
                  lhs: {"_type": "state", "data": ['storylines', 'current_storyline', "something"]},
                  operator: '==',
                  rhs: true
                },
                {
                  lhs: {"_type": "state", "data": ['resources', 'foo']},
                  operator: '>=',
                  rhs: 150
                },
              ],
            },
            weight: 1,
          }
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });
    });

    describe("on_display parsing", () => {
      test("should accept missing on_display key", () => {
        var e = getBasicEvent();
        var expected = getBasicEvent();
        expect(event.parseEvent(e)).toEqual(expected);
      });

      test('should parse enclosed operations', () => {
        var e = getBasicEvent();
        e.on_display = [
          'global.something = true',
          'resources.foo += 150'
        ];

        var expected = getBasicEvent();
        expected.on_display = [
          {
            lhs: {"_type": "state", "data": ['global', 'something']},
            operator: '=',
            rhs: true
          },
          {
            lhs: {"_type": "state", "data": ['resources', 'foo']},
            operator: '+=',
            rhs: 150
          },
        ];

        expect(event.parseEvent(e)).toEqual(expected);
      });
    });

    describe("Actions parsing", () => {
      test('should parse enclosed operations', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: [
              'global.something = true',
              'resources.foo += 150'
            ]
          }
        };

        var expected = getBasicEvent();
        expected.actions = {
          OK: {
            operations: [
              {
                lhs: {"_type": "state", "data": ['global', 'something']},
                operator: '=',
                rhs: true
              },
              {
                lhs: {"_type": "state", "data": ['resources', 'foo']},
                operator: '+=',
                rhs: 150
              },
            ]
          }
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });

      test('should parse enclosed conditions', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: [
              'global.something = true',
            ]
          },
          KO: {
            conditions: 'global.testval == 123',
            operations: [
              'global.something = false',
            ]
          }
        };

        var expected = getBasicEvent();
        expected.actions = {
          OK: {
            operations: [
              {
                lhs: {"_type": "state", "data": ['global', 'something']},
                operator: '=',
                rhs: true
              },
            ]
          },
          KO: {
            conditions: {
              lhs: {"_type": "state", "data": ['global', 'testval']},
              operator: '==',
              rhs: 123
            },
            operations: [
              {
                lhs: {"_type": "state", "data": ['global', 'something']},
                operator: '=',
                rhs: false
              },
            ]
          },
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });

      test('should replace shorthands', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: [
              'sl.something = "ABC"',
              'r.foo *= 5'
            ]
          }
        };

        var expected = getBasicEvent();
        expected.actions = {
          OK: {
            operations: [
              {
                lhs: {"_type": "state", "data": ['storylines', 'current_storyline', 'something']},
                operator: '=',
                rhs: "ABC"
              },
              {
                lhs: {"_type": "state", "data": ['resources', 'foo']},
                operator: '*=',
                rhs: 5
              },
            ]
          }
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });
    });

    describe("repeatable parsing", () => {
      test("should accept missing repeatable key", () => {
        var e = getBasicEvent();
        var expected = getBasicEvent();
        expect(event.parseEvent(e)).toEqual(expected);
      });

      test('should ensure repeatable is a boolean', () => {
        var e = getBasicEvent();
        e.repeatable = "LOL";

        expect(() => event.validateEvent(e)).toThrow(/repeatable should be of type 'boolean', not 'string'/i);
      });

      test('should save repeatable when it is specified', () => {
        var e = getBasicEvent();
        e.repeatable = true;

        var expected = getBasicEvent();
        expected.repeatable = true;

        expect(event.parseEvent(e)).toEqual(expected);
      });
    });

  });

  describe("getEvent()", function() {
    test('should read and parse event from disk', () => {
      expect(event.getEvent(__dirname + '/mocks/storylines', 'test_storyline_1', 'event_1_1')).toEqual({
        event: "event_1_1",
        storyline: "test_storyline_1",
        description: "Potentially multiline, markdown description of your event",
        repeatable: false,
        on_display: [],
        triggers: {
          soft: {
            conditions: {
              lhs: {"_type": "state", "data": ['global', 'test']},
              operator: '==',
              rhs: true
            },
            weight: 1,
          }
        },
        actions: {
          OK: {
            operations: [
              {
                lhs: {"_type": "state", "data": ['global', 'test']},
                operator: '=',
                rhs: false
              }
            ]
          }
        }
      });
    });
  });
});
