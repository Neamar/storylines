"use strict";
const config = require('../config');


describe("config file", () => {
  describe("readStoryConfig()", () => {
    test('should read config from disk', () => {
      var r = config.readStoryConfig(__dirname + '/mocks', 'storyline.config.yml');

      expect(r).toContain("version");
      expect(r).toContain("multiline");
      expect(r).toContain("---");
    });
  });

  describe("buildStoryConfig()", function() {
    test("should fail on invalid config", () => {
      expect(() => config.buildStoryConfig('FAKE')).toThrow(/valid FrontMatter/);
    });

    test("should transform front matter content to a JavaScript object", () => {
      var c = config.buildStoryConfig(`---
version: 1
---
TEST
`);

      expect(c.version).toBe(1);
      expect(c.story_description).toBe('TEST');
    });
  });

  describe("validateConfig()", function() {
    function getBasicConfig() {
      return {version: 1, story_title: "TEST", story_description: "TEST", resources: {}};
    }

    test('should ensure version is present and equal to 1', () => {
      expect(() => config.validateConfig({})).toThrow(/Missing version number/);
    });

    test('should ensure story_title is present', () => {
      expect(() => config.validateConfig({version: 1})).toThrow(/Missing story title/);
    });

    test('should ensure story_description is present', () => {
      expect(() => config.validateConfig({version: 1, story_title: "TEST"})).toThrow(/Missing story description/);
    });

    test('should work with the most basic config', () => {
      expect(config.validateConfig(getBasicConfig())).toEqual(getBasicConfig());
    });

    test('should ensure resources are correct slugs', () => {
      var c = getBasicConfig();
      c.resources["My resource"] = {};
      expect(() => config.validateConfig(c)).toThrow(/Invalid resource slug/);

      c = getBasicConfig();
      c.resources.ÀCôté = {};
      expect(() => config.validateConfig(c)).toThrow(/Invalid resource slug/);
    });

    test('should ensure resources have a description', () => {
      var c = getBasicConfig();
      c.resources.Resource1 = {};
      expect(() => config.validateConfig(c)).toThrow(/Missing resource description/);
    });

    test('should ensure resources have a format', () => {
      var c = getBasicConfig();
      c.resources.Resource1 = {
        description: "TEST"
      };
      expect(() => config.validateConfig(c)).toThrow(/Missing resource format/);
    });

    test('should ensure resources have a format containing a %s', () => {
      var c = getBasicConfig();
      c.resources.Resource1 = {
        description: "TEST",
        format: "INVALID"
      };
      expect(() => config.validateConfig(c)).toThrow(/Invalid resource format; must contain a %s/);
    });

    test('should ensure resources have a display_name', () => {
      var c = getBasicConfig();
      c.resources.Resource1 = {
        description: "TEST",
        format: "%s"
      };
      expect(() => config.validateConfig(c)).toThrow(/Missing resource display_name/);
    });

    test('should ensure resources have a default value', () => {
      var c = getBasicConfig();
      c.resources.Resource1 = {
        description: "TEST",
        format: "%s",
        display_name: "TEST"
      };
      expect(() => config.validateConfig(c)).toThrow(/Missing resource default value&/);
    });

    test('should work with a valid resource', () => {
      var c = getBasicConfig();
      c.resources.Resource1 = {
        description: "TEST",
        format: "%s",
        display_name: "TEST",
        default: 2
      };
      expect(config.validateConfig(c)).toEqual(c);
    });
  });

  describe("getConfig()", function() {
    test('should read and parse config from disk', () => {
      expect(config.getConfig(__dirname + '/mocks', 'storyline.config.yml')).toEqual({
        version: 1,
        story_title: "Title for your story",
        story_description: "Potentially multiline, markdown description of your story",
        resources: {
          Resource1: {
            description: "Resource description",
            format: "%s",
            display_name: "Resource 1",
            default: 100
          },
          Resource2: {
            description: "Resource description",
            format: "%s¥",
            display_name: "Resource 2",
            default: "ABC"
          }
        }
      });
    });
  });

});
