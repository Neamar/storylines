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
  var stubStoryline = new Storylines(stubStory, stubDisplayEvent, stubDisplayResources);

  describe("Conditions and operations", () => {
    describe("resolveStatePath()", () => {
      it("should return parent object and key when statePath exists", () => {
        stubStoryline.state = {
          general: {
            foo: "bar"
          }
        };

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
        stubStoryline.state = {
          general: {
            foo: "bar"
          }
        };

        expect(() => stubStoryline.resolveStatePath(['@', 'missing', 'foo'], true)).toThrow(/Trying to access non-existing path/i);
      });

      it("should stop with current situation when throwOnMissing is false", () => {
        stubStoryline.state = {
          general: {
            foo: "bar"
          }
        };

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
        stubStoryline.state = {
          general: {
            foo: "bar"
          }
        };

        expect(stubStoryline.resolveValue(['@', 'general', 'foo'])).toEqual("bar");
      });

      it("should resolve invalid state access to undefined", () => {
        stubStoryline.state = {
          general: {
            foo: "bar"
          }
        };

        expect(stubStoryline.resolveValue(['@', 'general', 'fizz'])).toBeUndefined();
      });
    });
  });
});
