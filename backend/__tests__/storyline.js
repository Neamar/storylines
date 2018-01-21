"use strict";
const storyline = require('../storyline');


describe("storyline file", () => {
  describe("getStorylinesSlugs()", () => {
    test('should read storylines from disk', () => {
      var storylines = storyline.getStorylinesSlugs(__dirname + '/mocks', 'storylines');

      expect(storylines).toEqual(['test_storyline_1', 'test_storyline_2']);
    });

    test('should throw if storylines folder is missing', () => {
      expect(() => storyline.getStorylinesSlugs(__dirname + '/mocks', 'invalid_storylines')).toThow(/Missing storylines folder/);
    });
  });
});
