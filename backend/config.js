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

function validateKeyType(object, keyName, keyType, msgNotFound) {
  var objectKeyType = typeof object[keyName];
  if(objectKeyType === 'undefined') {
    throw new Error("In 'config.js/validateKeyType': " + msgNotFound);
  }
  else if((keyType !== null) && (objectKeyType !== keyType)) {
    throw new Error("In 'config.js/validateKeyType': " + keyName + " should be of type '" + keyType + "', not '" + objectKeyType + "'");
  }
}

function validateResource(resource) {
  validateKeyType(resource, "description", "string", "Missing resource description");
  validateKeyType(resource, "format", "string", "Missing resource format");
  if(resource.format.indexOf("%s") === -1) {
    throw new Error("In 'config.js/validateResource': Invalid resource format; must contain a %s/i");
  }
  validateKeyType(resource, "display_name", "string", "Missing resource display_name");
  validateKeyType(resource, "default", null, "Missing resource default value");
}
/**
 * Ensure content is correct
 * @param jsonifiedYml YML content from the file
 * @return config object
 * @throws on invalid config
 */
function validateConfig(config) {
  validateKeyType(config, "version", "number", "Missing version number");

  if(SUPPORTED_VERSIONS.indexOf(config.version) === -1) {
    throw new Error("In 'config.js/validateConfig': Unsupported version. Version should be one of '" + SUPPORTED_VERSIONS.join() + "', not '"  + config.version  + "'");
  }

  validateKeyType(config, "story_title", "string", "Missing story title.");
  validateKeyType(config, "story_description", "string", "Missing story description.");
  validateKeyType(config, "resources", "object", "Missing resources definition.");

  var badSlugs = Object.keys(config.resources).filter(resource => !(helpers.isSlug(resource)));
  if(badSlugs.length > 0) {
    throw new Error("Invalid resource slug: '" + badSlugs.join() + "'");
  }

  Object.values(config.resources).forEach(function(resource) {
    validateResource(resource);
  });

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
