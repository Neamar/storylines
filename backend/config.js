"use strict";
var fs = require('fs');


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
  // TODO
  return {};
}


/**
 * Retrieve the config for a given story
 * @return a complete config
 */
function getConfig(storyPath, storyConfigFile) {
  var configContent = readStoryConfig(storyPath, storyConfigFile);

  return buildStoryConfig(configContent);
}


module.exports.getConfig = getConfig;
module.exports.readStoryConfig = readStoryConfig;
module.exports.buildStoryConfig = buildStoryConfig;
