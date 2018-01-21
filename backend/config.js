"use strict";
const fs = require('fs');
const frontMatter = require('front-matter');

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
 * Ensure content is correct
 * @param jsonifiedYml YML content from the file
 * @return config object
 * @throws on invalid config
 */
function validateConfig(jsonifiedYml) {
  // TODO
  return jsonifiedYml;
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
