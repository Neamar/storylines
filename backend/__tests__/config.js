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

    test('should ensure version is present', () => {
      expect(() => config.validateConfig({})).toThrow(/Missing version number/i);
    });

    test('should ensure version is a number', () => {
      expect(() => config.validateConfig({version: "this should throw an error"})).toThrow(/version should be of type 'number', not/i);
    });

    test('should ensure version is supported', () => {
      // For now, version 2 is unsupported
      expect(() => config.validateConfig({version: 2})).toThrow(/Unsupported version. Version should be one of/i);
    });

    test('should ensure story_title is present', () => {
      expect(() => config.validateConfig({version: 1})).toThrow(/Missing story title/i);
    });

    test('should ensure story_title is a string', () => {
      expect(() => config.validateConfig({version: 1, story_title: 1})).toThrow(/story_title should be of type 'string', not/i);
    });

    test('should ensure story_description is present', () => {
      expect(() => config.validateConfig({version: 1, story_title: "TEST"})).toThrow(/Missing story description/i);
    });

    test('should ensure story_description is a string', () => {
      expect(() => config.validateConfig({version: 1, story_title: "TEST", story_description: 1})).toThrow(/story_description should be of type 'string', not/i);
    });

    test('should ensure resources is present (can be empty)', () => {
      expect(() => config.validateConfig({version: 1, story_title: "TEST", story_description: "TEST"})).toThrow(/Missing resources definition/i);
    });

    test('should ensure resources is an object', () => {
      expect(() => config.validateConfig({version: 1, story_title: "TEST", story_description: "TEST", resources: "this should throw an error"})).toThrow(/resources should be of type 'object', not/i);
    });

    test('should work with the most basic config', () => {
      expect(config.validateConfig(getBasicConfig())).toEqual(getBasicConfig());
    });

    test('should ensure resources keys are correct slugs', () => {
      var c = getBasicConfig();
      c.resources["My resource"] = {};
      expect(() => config.validateConfig(c)).toThrow(/Invalid resource slug/i);

      c = getBasicConfig();
      c.resources.àcôté = {};
      expect(() => config.validateConfig(c)).toThrow(/Invalid resource slug/i);
    });

    test('should ensure resources have a description', () => {
      var c = getBasicConfig();
      c.resources.resource1 = {};
      expect(() => config.validateConfig(c)).toThrow(/Missing resource description/i);
    });

    test('should ensure resources have a format', () => {
      var c = getBasicConfig();
      c.resources.resource1 = {
        description: "TEST"
      };
      expect(() => config.validateConfig(c)).toThrow(/Missing resource format/i);
    });

    test('should ensure resources have a format containing a %s', () => {
      var c = getBasicConfig();
      c.resources.resource1 = {
        description: "TEST",
        format: "INVALID"
      };
      expect(() => config.validateConfig(c)).toThrow(/Invalid resource format; must contain a %s/i);
    });

    test('should ensure resources have a display_name', () => {
      var c = getBasicConfig();
      c.resources.resource1 = {
        description: "TEST",
        format: "%s"
      };
      expect(() => config.validateConfig(c)).toThrow(/Missing resource display_name/i);
    });

    test('should ensure resources have a default value', () => {
      var c = getBasicConfig();
      c.resources.resource1 = {
        description: "TEST",
        format: "%s",
        display_name: "TEST"
      };
      expect(() => config.validateConfig(c)).toThrow(/Missing resource default value/i);
    });

    test('should work with a valid resource', () => {
      var c = getBasicConfig();
      c.resources.resource1 = {
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
          resource1: {
            description: "Resource description",
            format: "%s",
            display_name: "Resource 1",
            default: 100
          },
          resource2: {
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
