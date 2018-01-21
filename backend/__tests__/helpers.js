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
});
