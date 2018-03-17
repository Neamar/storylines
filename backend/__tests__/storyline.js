"use strict";
const storyline = require('../storyline');


describe("storyline file", () => {
  describe("getStorylinesSlugs()", () => {
    it('should read storylines from disk', () => {
      var storylines = storyline.getStorylinesSlugs(__dirname + '/mocks', 'storylines');

      expect(storylines).toEqual(['test_storyline_1', 'test_storyline_2']);
    });

    it('should throw if storylines folder is missing', () => {
      expect(() => storyline.getStorylinesSlugs(__dirname + '/mocks/storylines', 'invalid_storylines')).toThrow(/invalid_storylines' is not a valid directory/i);
    });
  });

  describe("getEventsSlugs()", () => {
    it('should read events from disk', () => {
      var events = storyline.getEventsSlugs(__dirname + '/mocks', 'storylines', 'test_storyline_1');

      expect(events).toEqual(['event_1_1', 'event_1_2']);
    });

    it('should throw if specified storyline is not a slug', () => {
      expect(() => storyline.getEventsSlugs(__dirname + '/mocks', 'storylines', '1Not_a_slug')).toThrow(/'1Not_a_slug' is not a slug/i);
    });

    it('should throw if specified storyline folder does not exist', () => {
      expect(() => storyline.getEventsSlugs(__dirname + '/mocks', 'storylines', 'invalid_storyline')).toThrow(/invalid_storyline' is not a valid directory/i);
    });
  });
});
