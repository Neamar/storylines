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
    it('should read event from disk', () => {
      var r = event.readEvent(__dirname + '/mocks/storylines', 'test_storyline_1', 'event_1_1');

      expect(r).toContain("triggers");
      expect(r).toContain("g.test");
      expect(r).toContain("---");
    });

    it('should read event from disk', () => {
      var r = event.readEvent(__dirname + '/mocks/storylines', 'test_storyline_2', 'event_2_1');

      expect(r).toContain("triggers");
      expect(r).toContain("g.test");
      expect(r).toContain("---");
    });
  });

  describe("buildEvent()", function() {
    it("should fail on invalid event", () => {
      expect(() => event.buildEvent('FAKE', 's', 'e')).toThrow(/valid FrontMatter/);
    });

    it("should transform front matter content to a JavaScript object", () => {
      var e = event.buildEvent(`---
triggers:
    soft:
        condition: g.test == true
---
TEST
`, 'storyline_slug', 'event_slug');

      expect(e).toHaveProperty('description', '<p>TEST</p>');
      expect(e).toHaveProperty('event', 'event_slug');
      expect(e).toHaveProperty('storyline', 'storyline_slug');
      expect(e).toHaveProperty('triggers.soft.condition', 'g.test == true');
      expect(e).toHaveProperty('repeatable', false);
      expect(e).toHaveProperty('on_display', []);
    });

    it("should parse markdown", () => {
      var e = event.buildEvent(`---
triggers:
    soft:
        condition: g.test == true
---
*Hello*
`, 'storyline_slug', 'event_slug');

      expect(e).toHaveProperty('description', '<p><em>Hello</em></p>');
    });
  });

  describe("validateEvent()", function() {

    it('should ensure storyline slug is present', () => {
      expect(() => event.validateEvent({})).toThrow(/Missing storyline slug/i);
    });

    it('should ensure storyline is a slug', () => {
      expect(() => event.validateEvent({storyline: 'not a slug'})).toThrow(/storyline should be of type 'slug', not 'string'/i);
    });

    it('should ensure event slug is present', () => {
      expect(() => event.validateEvent({storyline: 'storyline_slug'})).toThrow(/Missing event/i);
    });

    it('should ensure event is a slug', () => {
      expect(() => event.validateEvent({storyline: 'storyline_slug', event: 'not a slug'})).toThrow(/event should be of type 'slug', not 'string'/i);
    });

    it('should ensure description is present', () => {
      expect(() => event.validateEvent({event: 'event_slug', storyline: 'storyline_slug'})).toThrow(/Missing event description/i);
    });

    it('should work with the most basic event', () => {
      expect(event.validateEvent(getBasicEvent())).toEqual(getBasicEvent());
    });

    describe("Trigger validation", () => {
      it('should ensure triggers is an object', () => {
        var e = getBasicEvent();
        e.triggers = [];

        expect(() => event.validateEvent(e)).toThrow(/triggers should be of type 'object', not 'array'/i);
      });
      it('should ensure triggers only contain hard or soft constraints', () => {
        var e = getBasicEvent();
        e.triggers = {
          nonexisting: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Triggers cannot be 'nonexisting'. Possible types are: hard, soft/i);
      });

      it('should ensure hard triggers have a condition property', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Triggers must include condition/i);
      });

      it('should ensure hard triggers weight property is numeric', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {
            condition: "",
            weight: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/weight should be of type 'number', not 'boolean'/i);
      });

      it('should accept hard triggers weight numeric property', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {
            condition: "",
            weight: 15
          }
        };

        expect(event.validateEvent(e)).toHaveProperty('triggers.hard.weight', 15);
      });

      it('should ensure soft triggers have a condition property', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Triggers must include condition/i);
      });

      it('should ensure soft triggers weight property is numeric', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            condition: "",
            weight: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/weight should be of type 'number', not 'boolean'/i);
      });

      it('should accept soft triggers weight numeric property', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            condition: "",
            weight: 15
          }
        };

        expect(event.validateEvent(e)).toHaveProperty('triggers.soft.weight', 15);
      });
    });

    describe("Actions validation", () => {
      it('should ensure actions is an object', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            condition: "",
            weight: 15
          }
        };
        e.actions = [];

        expect(() => event.validateEvent(e)).toThrow(/actions should be of type 'object', not 'array'/i);
      });

      it('should ensure actions contain an operations key', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            condition: "",
            weight: 15
          }
        };
        e.actions = {
          OK: {}
        };

        expect(() => event.validateEvent(e)).toThrow(/Actions must include operations/i);
      });

      it('should ensure actions operations is an array', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/operations should be of type 'array', not 'boolean'/i);
      });

      it('should ensure actions condition is an array', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: [],
            condition: false
          }
        };

        expect(() => event.validateEvent(e)).toThrow(/condition should be of type 'array', not 'boolean'/i);
      });
    });
  });

  describe("on_display operations", () => {
    it('should accept empty on_display', () => {
      var e = getBasicEvent();
      expect(event.validateEvent(e)).toHaveProperty("event", e.event);
    });

    it('should ensure on_display is an array', () => {
      var e = getBasicEvent();
      e.on_display = {};

      expect(() => event.validateEvent(e)).toThrow(/on_display should be of type 'array', not 'object'/i);
    });
  });

  describe("parseEvent()", () => {
    describe("Trigger parsing", () => {
      it('should parse enclosed soft condition', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            condition: 'global.something == true',
            weight: 1,
          }
        };

        var expected = getBasicEvent();
        expected.triggers = {
          soft: {
            condition: {
              '_type': 'atomic_condition',
              lhs: {"_type": "state", "data": ['global', 'something']},
              operator: '==',
              rhs: true
            },
            weight: 1,
          }
        };

        expect(event.parseEvent(e)).toEqual(expected);
      });

      it('should parse enclosed hard condition', () => {
        var e = getBasicEvent();
        e.triggers = {
          hard: {
            condition: {
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
            condition: {
              _type: 'propositional_condition',
              boolean_operator: 'AND',
              conditions: [
                {
                  _type: 'atomic_condition',
                  lhs: {"_type": "state", "data": ['global', 'something']},
                  operator: '==',
                  rhs: true
                },
                {
                  _type: 'atomic_condition',
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

      it('should replace shorthands', () => {
        var e = getBasicEvent();
        e.triggers = {
          soft: {
            condition: {
              AND: [
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
            condition: {
              _type: 'propositional_condition',
              boolean_operator: 'AND',
              conditions: [
                {
                  _type: 'atomic_condition',
                  lhs: {"_type": "state", "data": ['storylines', 'storyline_slug', "something"]},
                  operator: '==',
                  rhs: true
                },
                {
                  _type: 'atomic_condition',
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
      it("should accept missing on_display key", () => {
        var e = getBasicEvent();
        var expected = getBasicEvent();
        expect(event.parseEvent(e)).toEqual(expected);
      });

      it('should parse enclosed operations', () => {
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
      it('should parse enclosed operations', () => {
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

      it('should parse enclosed condition', () => {
        var e = getBasicEvent();
        e.actions = {
          OK: {
            operations: [
              'global.something = true',
            ]
          },
          KO: {
            condition: 'global.testval == 123',
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
            condition: {
              _type: 'atomic_condition',
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

      it('should replace shorthands', () => {
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
                lhs: {"_type": "state", "data": ['storylines', 'storyline_slug', 'something']},
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
      it("should accept missing repeatable key", () => {
        var e = getBasicEvent();
        var expected = getBasicEvent();
        expect(event.parseEvent(e)).toEqual(expected);
      });

      it('should ensure repeatable is a boolean', () => {
        var e = getBasicEvent();
        e.repeatable = "LOL";

        expect(() => event.validateEvent(e)).toThrow(/repeatable should be of type 'boolean', not 'string'/i);
      });

      it('should save repeatable when it is specified', () => {
        var e = getBasicEvent();
        e.repeatable = true;

        var expected = getBasicEvent();
        expected.repeatable = true;

        expect(event.parseEvent(e)).toEqual(expected);
      });
    });

  });

  describe("getEvent()", function() {
    it('should read and parse event from disk', () => {
      expect(event.getEvent(__dirname + '/mocks/storylines', 'test_storyline_1', 'event_1_1')).toEqual({
        event: "event_1_1",
        storyline: "test_storyline_1",
        description: "<p>Potentially multiline, markdown description of your event</p>",
        repeatable: false,
        on_display: [],
        triggers: {
          soft: {
            condition: {
              _type: 'atomic_condition',
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
