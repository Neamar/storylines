"use strict";
const fs = require('fs');
const frontMatter = require('front-matter');

const helpers = require('./helpers');

const SUPPORTED_VERSIONS = [1.0, ];

/**
 * Retrieve the YML config for a given story from disk
 * @return raw file content
 */
function readStoryConfig(storyPath, storyConfigFile) {
  return fs.readFileSync(`${storyPath}/${storyConfigFile}`).toString();
}


/**
 * Build story config from YML file
 * @param configContent raw file content
 * @return config object
 */
function buildStoryConfig(configContent) {
  if(!frontMatter.test(configContent)) {
    throw new Error("Config must be a valid FrontMatter file.");
  }

  var fm = frontMatter(configContent);
  var config = fm.attributes;
  config.story_description = fm.body.trim();
  return config;
}

/**
 * Validate that the resource completes the requirements
 * for a resource object:
 * - have description that is a string
 * - have a format that is a string containing '%s'
 * - have a display name that is a string
 * - have a default value
 * @param resource a resource object
 * @throws on invalid resource
 */
function validateResource(resource) {
  helpers.validateKeyType(resource, "description", "string", "Missing resource description");
  helpers.validateKeyType(resource, "format", "string", "Missing resource format");
  if(resource.format.indexOf("%s") === -1) {
    throw new Error("Invalid resource format; must contain a %s");
  }
  helpers.validateKeyType(resource, "display_name", "string", "Missing resource display_name");
  helpers.validateKeyType(resource, "default", null, "Missing resource default value");
}


/**
 * Ensure content is correct
 * @param jsonifiedYml YML content from the file
 * @return config object
 * @throws on invalid config
 */
function validateConfig(config) {
  helpers.validateKeyType(config, "version", "number", "Missing version number");

  if(SUPPORTED_VERSIONS.indexOf(config.version) === -1) {
    throw new Error("Unsupported version. Version should be one of '" + SUPPORTED_VERSIONS.join() + "', not '"  + config.version  + "'");
  }

  helpers.validateKeyType(config, "story_title", "string", "Missing story title.");
  helpers.validateKeyType(config, "story_description", "string", "Missing story description.");
  helpers.validateKeyType(config, "resources", "object", "Missing resources definition.");

  var badSlugs = Object.keys(config.resources).filter(resource => !(helpers.isSlug(resource)));
  if(badSlugs.length > 0) {
    throw new Error("Invalid resource slug: '" + badSlugs.join() + "'");
  }
  Object.values(config.resources).forEach(validateResource);

  return config;
}


/**
 * Retrieve the config for a given story
 * @return a complete config
 */
function getConfig(storyPath, storyConfigFile) {
  var configContent = readStoryConfig(storyPath, storyConfigFile);

  var jsonifiedYml = buildStoryConfig(configContent);

  var config = validateConfig(jsonifiedYml);

  return config;
}


module.exports.getConfig = getConfig;
module.exports.readStoryConfig = readStoryConfig;
module.exports.buildStoryConfig = buildStoryConfig;
module.exports.validateConfig = validateConfig;
