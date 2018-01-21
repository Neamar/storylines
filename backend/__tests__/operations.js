"use strict";

const operations = require('../operations.js');


describe("operations", () => {
  describe("parseOperation()", () => {
    test("should parse valid operation", () => {
      expect(operations.parseOperation('global.something = true')).toEqual({
        lhs: ["@", "global", "something"],
        operator: "=",
        rhs: true
      });
    });

    test("should require a valid assignment operator", () => {
      expect(() => operations.parseOperation('global.something == true')).toThrow(/Invalid operator ==/i);
    });

    test("should require lhs to be a state access", () => {
      expect(() => operations.parseOperation('true == true')).toThrow(/Operation lhs must change state/i);
    });
  });
});
