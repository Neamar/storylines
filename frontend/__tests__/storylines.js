"use strict";
const Storylines = require('../../frontend/storylines.js');


describe("Storylines", () => {
  var stubDisplayEvent = () => {};
  var stubDisplayResources = () => {};
  var stubStory = {
    events: [],
    resources: {
      'r': {}
    },
    story_title: 'title',
    story_description: 'description'
  };

  function getGeneralFooEqualBarState(value) {
    return {
      general: {
        foo: value || "bar"
      }
    };
  }

  var stubStoryline = new Storylines(stubStory, stubDisplayEvent, stubDisplayResources);

  describe("Conditions and operations", () => {
    describe("resolveStatePath()", () => {
      it("should return parent object and key when statePath exists", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        var r = stubStoryline.resolveStatePath(['@', 'general', 'foo']);

        expect(r).toHaveProperty('parent', stubStoryline.state.general);
        expect(r).toHaveProperty('key', 'foo');
        expect(r).toHaveProperty('missing', false);
        expect(r).toHaveProperty('missingOnLastLevel', false);
      });

      it("should return parent object and key when statePath exists in nested access", () => {
        stubStoryline.state = {
          general: {
            foo: {
              bar: {
                fizz: "buzz"
              }}
          }
        };

        var r = stubStoryline.resolveStatePath(['@', 'general', 'foo', 'bar', 'fizz']);

        expect(r).toHaveProperty('parent', stubStoryline.state.general.foo.bar);
        expect(r).toHaveProperty('key', 'fizz');
        expect(r).toHaveProperty('missing', false);
        expect(r).toHaveProperty('missingOnLastLevel', false);
      });

      it("should throw when throwOnMissing is true", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        expect(() => stubStoryline.resolveStatePath(['@', 'missing', 'foo'], true)).toThrow(/Trying to access non-existing path/i);
      });

      it("should stop with current situation when throwOnMissing is false", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        var r = stubStoryline.resolveStatePath(['@', 'missing', 'foo']);

        expect(r).toHaveProperty('parent', stubStoryline.state);
        expect(r).toHaveProperty('key', 'missing');
        expect(r).toHaveProperty('missing', true);
        expect(r).toHaveProperty('missingOnLastLevel', false);
      });

      it("should indicate that value is missing on last level", () => {
        stubStoryline.state = {
          general: {
            foo: "bar"
          }
        };

        var r = stubStoryline.resolveStatePath(['@', 'general', 'fizz']);

        expect(r).toHaveProperty('parent', stubStoryline.state.general);
        expect(r).toHaveProperty('key', 'fizz');
        expect(r).toHaveProperty('missing', true);
        expect(r).toHaveProperty('missingOnLastLevel', true);
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
        stubStoryline.state = getGeneralFooEqualBarState();

        expect(stubStoryline.resolveValue(['@', 'general', 'foo'])).toEqual("bar");
      });

      it("should resolve invalid state access (last level) to undefined", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        expect(stubStoryline.resolveValue(['@', 'general', 'fizz'])).toBeUndefined();
      });

      it("should resolve invalid state access (before last level) to undefined", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        expect(stubStoryline.resolveValue(['@', 'buzz', 'fizz'])).toBeUndefined();
      });
    });

    describe("applyOperation()", () => {
      it("should fail on any operator when missing a value before the last one", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: ['@', 'g', 'fizz'],
            operator: '=',
            rhs: 'buzz'
          });
        }
        expect(deferred).toThrow(/Trying to access non-existing path in state/i);
      });

      it("should work on = operator", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '=',
          rhs: 'baz'
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', "baz");
      });

      it("should work on = operator when rhs is a state access", () => {
        stubStoryline.state = {
          general: {
            foo: 1,
            bar: 2
          }
        };

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '=',
          rhs: ['@', 'general', 'bar'],
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', 2);
      });

      it("should work on = operator when creating a new value", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'fizz'],
          operator: '=',
          rhs: 'buzz'
        });

        expect(stubStoryline.state).toHaveProperty('general.fizz', "buzz");
      });

      it("should work on += operator", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '+=',
          rhs: 'baz'
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', "barbaz");
      });

      it("should fail on += operator when accessing non existing final value", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: ['@', 'general', 'fizz'],
            operator: '+=',
            rhs: 'buzz'
          });
        }

        expect(deferred).toThrow(/Can't apply compound operator on undefined/i);
      });

      it("should work on += operator when rhs is a state access", () => {
        stubStoryline.state = {
          general: {
            foo: 1,
            bar: 2
          }
        };

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '+=',
          rhs: ['@', 'general', 'bar'],
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', 3);
      });

      it("should work on -= operator", () => {
        stubStoryline.state = getGeneralFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '-=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', 8);
      });

      it("should fail on -= operator when accessing non existing final value", () => {
        stubStoryline.state = getGeneralFooEqualBarState();

        function deferred() {
          stubStoryline.applyOperation({
            lhs: ['@', 'general', 'fizz'],
            operator: '-=',
            rhs: 3
          });
        }

        expect(deferred).toThrow(/Can't apply compound operator on undefined/i);
      });

      it("should work on *= operator", () => {
        stubStoryline.state = getGeneralFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '*=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', 20);
      });

      it("should work on /= operator", () => {
        stubStoryline.state = getGeneralFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '/=',
          rhs: 2
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', 5);
      });

      it("should work on %= operator", () => {
        stubStoryline.state = getGeneralFooEqualBarState(10);

        stubStoryline.applyOperation({
          lhs: ['@', 'general', 'foo'],
          operator: '%=',
          rhs: 7
        });

        expect(stubStoryline.state).toHaveProperty('general.foo', 3);
      });
    });
  });
});
