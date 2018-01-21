"use strict";
const storyline = require('../storyline');


describe("storyline file", () => {
  describe("getStorylinesSlugs()", () => {
    test('should read storylines from disk', () => {
      var storylines = storyline.getStorylinesSlugs(__dirname + '/mocks', 'storylines');

      expect(storylines).toEqual(['test_storyline_1', 'test_storyline_2']);
    });

    test('should throw if storylines folder is missing', () => {
      expect(() => storyline.getStorylinesSlugs(__dirname + '/mocks', 'invalid_storylines')).toThow(/Missing storylines folder: invalid_storylines\∕/i);
    });
  });

  describe("getEventsSlugs()", () => {
    test('should read events from disk', () => {
      var events = storyline.getEventsSlugs(__dirname + '/mocks', 'storylines', 'test_storyline_1');

      expect(events).toEqual(['event_1_1', 'event_1_2']);
    });

    test('should throw if specified storyline folder does not exist', () => {
      expect(() => storyline.getEventsSlugs(__dirname + '/mocks', 'storylines', 'invalid_storyline')).toThow(/Missing storyline folder: invalid_storyline\∕/i);
    });
  });
});
