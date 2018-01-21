"use strict";

const conditions = require('../conditions.js');


describe("conditions", () => {
  describe("parseCondition()", () => {
    test("should parse valid condition", () => {
      expect(conditions.parseCondition('global.something == true')).toEqual({
        lhs: ["@", "global", "something"],
        operator: "==",
        rhs: true
      });
    });

    test("should require a valid comparison operator", () => {
      expect(() => conditions.parseCondition('global.something += true')).toThrow(/Invalid operator \+=/i);
    });

  });
});
