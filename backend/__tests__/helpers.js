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

    test('should return true on a single lowercase letter', () => {
      expect(helpers.isSlug("x")).toBeTruthy();
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
      expect(() => helpers.parseYmlCode('"something"foo" == true')).toThrow(/is an invalid string expression/i);
    });

    test('should fail on invalid lhs with single quote delimiter in string', () => {
      expect(() => helpers.parseYmlCode("'something'foo' == true")).toThrow(/is an invalid string expression/i);
    });

    test('should fail on invalid lhs with strings', () => {
      expect(() => helpers.parseYmlCode('"something" "foo" == true')).toThrow(/is an invalid string expression/i);
    });

    test('should parse booleans', () => {
      expect(helpers.parseYmlCode('"something" == true')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: true
      });
    });

    test('should fail on invalid lhs with booleans', () => {
      expect(() => helpers.parseYmlCode('true false == true')).toThrow(/Invalid expression/i);
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

    test('should parse access to the state', () => {
      expect(helpers.parseYmlCode('global.something == true')).toEqual({
        lhs: {_type: "state", data:["global", "something"]},
        operator: "==",
        rhs: true
      });
    });

    test('should allow for access to the state on both sides', () => {
      expect(helpers.parseYmlCode('global.something %= global.something_else')).toEqual({
        lhs: {_type: "state", data:["global", "something"]},
        operator: "%=",
        rhs: {_type: "state", data:["global", "something_else"]},
      });
    });

    test('should allow the null keyword', () => {
      expect(helpers.parseYmlCode('global.something = null')).toEqual({
        lhs: {_type: "state", data:["global", "something"]},
        operator: "=",
        rhs: null,
      });
    });

    test('should parse access to the state and allow index notation', () => {
      expect(helpers.parseYmlCode('global.something.0 == true')).toEqual({
        lhs: {_type: "state", data:["global", "something", "0"]},
        operator: "==",
        rhs: true
      });
    });

    test('should fail on invalid state access (space)', () => {
      expect(() => helpers.parseYmlCode('global.something something == true')).toThrow(/Invalid expression/i);
    });

    test('should fail on invalid state access (character)', () => {
      expect(() => helpers.parseYmlCode('global.àcôté == true')).toThrow(/Invalid expression/i);
    });

    test('should fail on invalid state access (non alpha first char)', () => {
      expect(() => helpers.parseYmlCode('global.1test == true')).toThrow(/Invalid expression/i);
    });

    test('should fail on invalid lhs with index notation', () => {
      expect(() => helpers.parseYmlCode('global.something[1] == true')).toThrow(/Invalid expression/i);
    });

    test('should parse advanced operators', () => {
      expect(helpers.parseYmlCode('"First Lieutenant" IN global.crew.officers')).toEqual({
        lhs: "First Lieutenant",
        operator: "IN",
        rhs: {_type: "state", data:["global", "crew", "officers"]},
      });
    });

    test('should work with contrived examples', () => {
      expect(helpers.parseYmlCode('"+= ==" NOT IN global.crew.officers')).toEqual({
        lhs: "+= ==",
        operator: "NOT IN",
        rhs: {_type: "state", data:["global", "crew", "officers"]},
      });
    });

    test('should allow for nested access to the state', () => {
      expect(helpers.parseYmlCode('global.something.deeper.nested == true')).toEqual({
        lhs: {_type: "state", data:["global", "something", "deeper", "nested"]},
        operator: "==",
        rhs: true
      });
    });

    test('should require an operator', () => {
      expect(() => helpers.parseYmlCode('global.something.deeper.nested')).toThrow(/Could not find the operator/i);
    });

    test('should require a valid operator', () => {
      expect(() => helpers.parseYmlCode('global.something @ true')).toThrow(/Could not find the operator/i);
    });

    test('should require a rhs', () => {
      expect(() => helpers.parseYmlCode('global.something == ')).toThrow(/Missing right-hand side/i);
    });

    test('should require a lhs', () => {
      expect(() => helpers.parseYmlCode(' == true')).toThrow(/Missing left-hand side/i);
    });

    test('should expand shorthands in state access', () => {
      expect(helpers.parseYmlCode('g.something == true', {g: 'global'})).toEqual({
        lhs: {_type: "state", data:["global", "something"]},
        operator: "==",
        rhs: true
      });
    });

    test('should expand complex shorthands in state access', () => {
      expect(helpers.parseYmlCode('sl.something == true', {sl: 'storylines.current_storyline'})).toEqual({
        lhs: {_type: "state", data:["storylines", "current_storyline", "something"]},
        operator: "==",
        rhs: true
      });
    });

    test('should only expand shorthands in first level', () => {
      expect(helpers.parseYmlCode('global.g.something == "a string"', {g: 'global'})).toEqual({
        lhs: {_type: "state", data:["global", "g", "something"]},
        operator: "==",
        rhs: "a string"
      });
    });
  });
});
