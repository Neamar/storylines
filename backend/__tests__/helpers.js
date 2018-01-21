"use strict";
const helpers = require('../helpers.js');


describe("helpers", () => {
  describe("isSlug()", () => {
    test('should return true on a valid slug', () => {
      expect(helpers.isSlug("valid_slug")).toBeTruthy();
    });

    test('should return false on a slug with spaces', () => {
      expect(helpers.isSlug("invalid slug")).toBeFalsy();
    });

    test('should return false on a slug starting with a number', () => {
      expect(helpers.isSlug("1slug")).toBeFalsy();
    });
  });

  describe("parseYmlCode()", () => {
    test('should parse strings', () => {
      expect(helpers.parseYmlCode('"something" == "something"')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: "something"
      });
    });

    test('should parse booleans', () => {
      expect(helpers.parseYmlCode('"something" == true')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: true
      });
    });

    test('should parse empty arrays', () => {
      expect(helpers.parseYmlCode('"something" == []')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: []
      });
    });

    test('should parse arrays', () => {
      expect(helpers.parseYmlCode('"something" == ["test"]')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: ["test"]
      });
    });

    test('should parse access to the state with an @', () => {
      expect(helpers.parseYmlCode('global.something == true')).toEqual({
        lhs: ["@", "global", "something"],
        operator: "==",
        rhs: true
      });
    });

    test('should allow for nested access to the state with an @', () => {
      expect(helpers.parseYmlCode('global.something.deeper.nested == true')).toEqual({
        lhs: ["@", "global", "something", "deeper", "nested"],
        operator: "==",
        rhs: true
      });
    });

    test('should require an operator', () => {
      expect(() => helpers.parseYmlCode('global.something.deeper.nested')).toThrow(/Missing operator/i);
    });

    test('should require a valid operator', () => {
      expect(() => helpers.parseYmlCode('global.something.deeper.nested @ true')).toThrow(/Invalid operator/i);
    });

    test('should require a rhs', () => {
      expect(() => helpers.parseYmlCode('global.something == ')).toThrow(/Missing rhs/i);
    });

    test('should require a lhs', () => {
      expect(() => helpers.parseYmlCode('== true')).toThrow(/Missing lhs/i);
    });

    test('should expand shorthands in state access', () => {
      expect(helpers.parseYmlCode('g.something == true'), {g: 'global'}).toEqual({
        lhs: ["@", "global", "something"],
        operator: "==",
        rhs: true
      });
    });

    test('should expand complex shorthands in state access', () => {
      expect(helpers.parseYmlCode('sl.something == true'), {sl: 'storylines.current_storyline'}).toEqual({
        lhs: ["@", "storylines", "current_storyline", "something"],
        operator: "==",
        rhs: true
      });
    });
  });
});
