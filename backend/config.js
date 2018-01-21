"use strict";


/**
 * Retrieve the YML config for a given story from disk
 */
function readStoryConfig(storyPath, storyConfigFile) {

}


/**
 * Build story config from YML file
 */
function buildStoryConfig(configContent) {

}



/**
 * Retrieve the config for a given story
 */
module.exports.getConfig = function getConfig(storyPath, storyConfigFile) {
  var configContent = readStoryConfig(storyPath, storyConfigFile);

  return buildStoryConfig(configContent);
};


module.exports.readStoryConfig = readStoryConfig;
module.exports.buildStoryConfig = buildStoryConfig;
