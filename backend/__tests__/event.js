"use strict";
const event = require('../event');


describe("event file", () => {
  describe("readEvent()", () => {
    test('should read event from disk', () => {
      var r = event.readEvent(__dirname + '/mocks', 'test_storyline_1', 'event_1_1.md');

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

      expect(e.triggers.soft.conditions[0]).toBe('g.test == true');
      expect(e.description).toBe('TEST');
      expect(e.event).toBe('event_slug');
      expect(e.storyline).toBe('storyline_slug');
    });
  });

  describe("validateEvent()", function() {
    function getBasicEvent() {
      return {description: "Description", event: 'event_slug', storyline: 'storyline_slug'};
    }

    test('should ensure storyline slug is present', () => {
      expect(() => event.validateEvent({})).toThrow(/Missing storyline slug/i);
    });

    test('should ensure event slug is present', () => {
      expect(() => event.validateEvent({storyline: 'storyline_slug'})).toThrow(/Missing event slug: storyline_slug\//i);
    });

// triggers: {soft: {conditions: ['g.test == true']}}
    test('should ensure description is present', () => {
      expect(() => event.validateEvent({event: 'event_slug', storyline: 'storyline_slug'})).toThrow(/Missing event description: storyline_slug\/event_slug/i);
    });

    test('should work with the most basic event', () => {
      expect(event.validateEvent(getBasicEvent())).toEqual(getBasicEvent());
    });

    test('should ensure triggers only contain hard or soft constraints', () => {
      var e = getBasicEvent();
      e.triggers = {
        'nonexisting': {}
      };

      expect(() => event.validateEvent(e)).toThrow(/Triggers must be either hard or soft: storyline_slug\/event_slug/i);
    });

    test('should ensure hard triggers have a conditions property', () => {
      var e = getBasicEvent();
      e.triggers = {
        'hard': {}
      };

      expect(() => event.validateEvent(e)).toThrow(/Hard triggers must have include conditions: storyline_slug\/event_slug/i);
    });

    test('should ensure soft triggers have a conditions property', () => {
      var e = getBasicEvent();
      e.triggers = {
        'soft': {}
      };

      expect(() => event.validateEvent(e)).toThrow(/Soft triggers must have include conditions: storyline_slug\/event_slug/i);
    });
  });

  describe("getEvent()", function() {
    test('should read and parse event from disk', () => {
      expect(event.getEvent(__dirname + '/mocks', 'test_storyline_1', 'event_1_1')).toEqual({
        event: "event_1_1",
        storyline: "test_storyline_1",
        description: "Potentially multiline, markdown description of your event",
        triggers: {
          soft: {
            conditions: [
              {
                lhs: ['global', 'test'],
                operator: '==',
                rhs: [true]
              }
            ]
          }
        },
        actions: {
          OK: {
            operations: [
              {
                lhs: ['global', 'test'],
                operator: '=',
                rhs: [false]
              }
            ]
          }
        }
      });
    });
  });

});
