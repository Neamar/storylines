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

    test('should parse strings with spaces', () => {
      expect(helpers.parseYmlCode('"to be or not to be" == "something"')).toEqual({
        lhs: "to be or not to be",
        operator: "==",
        rhs: "something"
      });
    });

    test('should parse strings looking like dot notation', () => {
      expect(helpers.parseYmlCode('"global.something" == "something"')).toEqual({
        lhs: "global.something",
        operator: "==",
        rhs: "something"
      });
    });

    test('should not do shorthand expansion on strings', () => {
      expect(helpers.parseYmlCode('"sl.something" == "something"')).toEqual({
        lhs: "sl.something",
        operator: "==",
        rhs: "something"
      });
    });

    test('should allow for single quotes', () => {
      expect(helpers.parseYmlCode("'something' == 'something'")).toEqual({
        lhs: "something",
        operator: "==",
        rhs: "something"
      });
    });

    test('should allow for mixed single quotes and double quotes', () => {
      expect(helpers.parseYmlCode("'something' == \"something\"")).toEqual({
        lhs: "something",
        operator: "==",
        rhs: "something"
      });
    });

    test('should fail on invalid lhs with double quote delimiter in string', () => {
      expect(() => helpers.parseYmlCode('"something"foo" == true')).toThrow(/Invalid lhs/i);
    });

    test('should fail on invalid lhs with single quote delimiter in string', () => {
      expect(() => helpers.parseYmlCode("'something'foo' == true")).toThrow(/Invalid lhs/i);
    });

    test('should fail on invalid lhs with strings', () => {
      expect(() => helpers.parseYmlCode('"something" "foo" == true')).toThrow(/Invalid lhs/i);
    });

    test('should parse booleans', () => {
      expect(helpers.parseYmlCode('"something" == true')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: true
      });
    });

    test('should fail on invalid lhs with booleans', () => {
      expect(() => helpers.parseYmlCode('true false == true')).toThrow(/Invalid lhs/i);
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

    test('should allow for access to the state on both sides', () => {
      expect(helpers.parseYmlCode('global.something %= global.something_else')).toEqual({
        lhs: ["@", "global", "something"],
        operator: "%=",
        rhs: ["@", "global", "something_else"],
      });
    });

    test('should allow the null keyword', () => {
      expect(helpers.parseYmlCode('global.something = null')).toEqual({
        lhs: ["@", "global", "something"],
        operator: "=",
        rhs: null,
      });
    });

    test('should parse access to the state with an @ and allow index notation', () => {
      expect(helpers.parseYmlCode('global.something.0 == true')).toEqual({
        lhs: ["@", "global", "something", "0"],
        operator: "==",
        rhs: true
      });
    });

    test('should fail on invalid state access (space)', () => {
      expect(() => helpers.parseYmlCode('global.something something == true')).toThrow(/Invalid lhs/i);
    });

    test('should fail on invalid state access (character)', () => {
      expect(() => helpers.parseYmlCode('global.àcôté == true')).toThrow(/Invalid lhs/i);
    });

    test('should fail on invalid state access (non alpha first char)', () => {
      expect(() => helpers.parseYmlCode('global.1test == true')).toThrow(/Invalid lhs/i);
    });

    test('should fail on invalid lhs with index notation', () => {
      expect(() => helpers.parseYmlCode('global.something[1] == true')).toThrow(/Invalid lhs/i);
    });

    test('should parse advanced operators', () => {
      expect(helpers.parseYmlCode('"First Lieutenant" IN global.crew.officers')).toEqual({
        lhs: "First Lieutenant",
        operator: "IN",
        rhs: ["@", "global", "crew", "officers"]
      });
    });

    test('should work with contrived examples', () => {
      expect(helpers.parseYmlCode('"+= ==" NOT IN global.crew.officers')).toEqual({
        lhs: "+= ==",
        operator: "NOT IN",
        rhs: ["@", "global", "crew", "officers"]
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
      expect(() => helpers.parseYmlCode('global.something @ true')).toThrow(/Invalid operator/i);
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

    test('should only expand shorthands in first level', () => {
      expect(helpers.parseYmlCode('global.g.something == "a string"'), {g: 'global'}).toEqual({
        lhs: ["@", "global", "g", "something"],
        operator: "==",
        rhs: "a string"
      });
    });
  });
});
