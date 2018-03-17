"use strict";
const helpers = require('../helpers.js');


describe("helpers", () => {
  describe("isSlug()", () => {
    it('should return true on a valid slug', () => {
      expect(helpers.isSlug("valid_slug")).toBeTruthy();
    });

    it('should return false on a slug with spaces', () => {
      expect(helpers.isSlug("invalid slug")).toBeFalsy();
    });

    it('should return true on a single lowercase letter', () => {
      expect(helpers.isSlug("x")).toBeTruthy();
    });

    it('should return false on a slug starting with a number', () => {
      expect(helpers.isSlug("1slug")).toBeFalsy();
    });
  });

  describe("getBooleanArg", () => {
    it("'true' should return true", () => {
      expect(helpers.getBooleanArg("true")).toBeTruthy();
    });

    it("'false' should return false", () => {
      expect(helpers.getBooleanArg("false")).toBeFalsy();
    });

    it("(Almost) anything else should throw ('True', 'TRUE', 'False', and 'FALSE' are accepted)", () => {
      expect(() => helpers.getBooleanArg("FaLSE")).toThrow(/Invalid boolean expression: 'FaLSE'/i);
    });
  });

  describe("parseYmlCode()", () => {
    it('should parse strings', () => {
      expect(helpers.parseYmlCode('"something" == "something"')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: "something"
      });
    });

    it('should throw on multiple operators', () => {
      expect(() => helpers.parseYmlCode('"something" += == "something"')).toThrow(/Too many operator candidates:/i);
    });

    it('should parse strings with spaces', () => {
      expect(helpers.parseYmlCode('"to be or not to be" == "something"')).toEqual({
        lhs: "to be or not to be",
        operator: "==",
        rhs: "something"
      });
    });

    it('should parse strings looking like dot notation', () => {
      expect(helpers.parseYmlCode('"global.something" == "something"')).toEqual({
        lhs: "global.something",
        operator: "==",
        rhs: "something"
      });
    });

    it('should not do shorthand expansion on strings', () => {
      expect(helpers.parseYmlCode('"sl.something" == "something"')).toEqual({
        lhs: "sl.something",
        operator: "==",
        rhs: "something"
      });
    });

    it('should allow for single quotes', () => {
      expect(helpers.parseYmlCode("'something' == 'something'")).toEqual({
        lhs: "something",
        operator: "==",
        rhs: "something"
      });
    });

    it('should allow for mixed single quotes and double quotes', () => {
      expect(helpers.parseYmlCode("'something' == \"something\"")).toEqual({
        lhs: "something",
        operator: "==",
        rhs: "something"
      });
    });

    it('should fail on invalid lhs with double quote delimiter in string', () => {
      expect(() => helpers.parseYmlCode('"something"foo" == true')).toThrow(/is an invalid string expression/i);
    });

    it('should fail on invalid lhs with single quote delimiter in string', () => {
      expect(() => helpers.parseYmlCode("'something'foo' == true")).toThrow(/is an invalid string expression/i);
    });

    it('should fail on invalid lhs with strings', () => {
      expect(() => helpers.parseYmlCode('"something" "foo" == true')).toThrow(/is an invalid string expression/i);
    });

    it('should parse booleans', () => {
      expect(helpers.parseYmlCode('"something" == true')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: true
      });
    });

    it('should parse floats', () => {
      expect(helpers.parseYmlCode('"Pi" == 3.1415926')).toEqual({
        lhs: "Pi",
        operator: "==",
        rhs: 3.1415926
      });
    });

    it('should fail on invalid lhs with booleans', () => {
      expect(() => helpers.parseYmlCode('true false == true')).toThrow(/Invalid expression/i);
    });

    it('should parse empty arrays', () => {
      expect(helpers.parseYmlCode('"something" == []')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: []
      });
    });

    it('should parse arrays', () => {
      expect(helpers.parseYmlCode('"something" == ["test"]')).toEqual({
        lhs: "something",
        operator: "==",
        rhs: ["test"]
      });
    });

    it('should parse access to the state', () => {
      expect(helpers.parseYmlCode('global.something == true')).toEqual({
        lhs: {_type: "state", data: ["global", "something"]},
        operator: "==",
        rhs: true
      });
    });

    it('should allow for access to the state on both sides', () => {
      expect(helpers.parseYmlCode('global.something %= global.something_else')).toEqual({
        lhs: {_type: "state", data: ["global", "something"]},
        operator: "%=",
        rhs: {_type: "state", data: ["global", "something_else"]},
      });
    });

    it('should allow the null keyword', () => {
      expect(helpers.parseYmlCode('global.something = null')).toEqual({
        lhs: {_type: "state", data: ["global", "something"]},
        operator: "=",
        rhs: null,
      });
    });

    it('should parse access to the state and allow index notation', () => {
      expect(helpers.parseYmlCode('global.something.0 == true')).toEqual({
        lhs: {_type: "state", data: ["global", "something", "0"]},
        operator: "==",
        rhs: true
      });
    });

    it('should fail on invalid state access (space)', () => {
      expect(() => helpers.parseYmlCode('global.something something == true')).toThrow(/Invalid expression/i);
    });

    it('should fail on invalid state access (character)', () => {
      expect(() => helpers.parseYmlCode('global.àcôté == true')).toThrow(/Invalid expression/i);
    });

    it('should fail on invalid state access (non alpha first char)', () => {
      expect(() => helpers.parseYmlCode('global.1test == true')).toThrow(/Invalid expression/i);
    });

    it('should fail on invalid lhs with index notation', () => {
      expect(() => helpers.parseYmlCode('global.something[1] == true')).toThrow(/Invalid expression/i);
    });

    it('should parse advanced operators', () => {
      expect(helpers.parseYmlCode('"First Lieutenant" IN global.crew.officers')).toEqual({
        lhs: "First Lieutenant",
        operator: "IN",
        rhs: {_type: "state", data: ["global", "crew", "officers"]},
      });
    });

    it('should work with contrived examples', () => {
      expect(helpers.parseYmlCode('"+= ==" NOT IN global.crew.officers')).toEqual({
        lhs: "+= ==",
        operator: "NOT IN",
        rhs: {_type: "state", data: ["global", "crew", "officers"]},
      });
    });

    it('should allow for nested access to the state', () => {
      expect(helpers.parseYmlCode('resources.something.deeper.nested == true')).toEqual({
        lhs: {_type: "state", data: ["resources", "something", "deeper", "nested"]},
        operator: "==",
        rhs: true
      });
    });

    it('should require an operator', () => {
      expect(() => helpers.parseYmlCode('global.something.deeper.nested')).toThrow(/Could not find the operator/i);
    });

    it('should require a valid operator', () => {
      expect(() => helpers.parseYmlCode('global.something @ true')).toThrow(/Could not find the operator/i);
    });

    it('should require a rhs', () => {
      expect(() => helpers.parseYmlCode('global.something == ')).toThrow(/Missing right-hand side/i);
    });

    it('should require a lhs', () => {
      expect(() => helpers.parseYmlCode(' == true')).toThrow(/Missing left-hand side/i);
    });

    it('should expand shorthands in state access', () => {
      expect(helpers.parseYmlCode('g.something == true')).toEqual({
        lhs: {_type: "state", data: ["global", "something"]},
        operator: "==",
        rhs: true
      });
    });

    it('should require valid first level', () => {
      expect(() => helpers.parseYmlCode('invalid.something == "something"')).toThrow(/First-Level must be one of/i);
    });

    it('should expand complex shorthands in state access', () => {
      expect(helpers.parseYmlCode('sl.something == true', {storyline: "a_storyline"})).toEqual({
        lhs: {_type: "state", data: ["storylines", "a_storyline", "something"]},
        operator: "==",
        rhs: true
      });
    });

    it('should only expand shorthands in first level', () => {
      expect(helpers.parseYmlCode('s.g.something == "a string"')).toEqual({
        lhs: {_type: "state", data: ["storylines", "g", "something"]},
        operator: "==",
        rhs: "a string"
      });
    });
  });

  describe("validateKeyType", () => {
    it('should work for a simple string case', () => {
      expect(helpers.validateKeyType({"test": ""}, "test", "string"));
    });

    it('should work for a simple number case', () => {
      expect(helpers.validateKeyType({"test": 42}, "test", "number"));
    });

    it('should work for a simple array case', () => {
      expect(helpers.validateKeyType({"test": []}, "test", "array"));
    });

    it('should work for a simple object case', () => {
      expect(helpers.validateKeyType({"test": {}}, "test", "object"));
    });

    it('should not work for wrong type', () => {
      expect(() => helpers.validateKeyType({"test": ""}, "test", "object")).toThrow(/test should be of type 'object', not 'string'/i);
    });

    it('should throw if the key does not exist', () => {
      expect(() => helpers.validateKeyType({"test": ""}, "oops", "object")).toThrow(/'oops' doesn't exist/i);
    });

    it('should throw the error message if specified', () => {
      expect(() => helpers.validateKeyType({"test": ""}, "oops", "object", "404 Not Found")).toThrow("404 Not Found");
    });

    it('should accept string if type is null', () => {
      expect(helpers.validateKeyType({"test": ""}, "test", null, "404 Not Found"));
    });
  });
});
