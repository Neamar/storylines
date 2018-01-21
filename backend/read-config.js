"use strict";
var async = require("async");


/**
 * Retrieve the YML config for a given story from disk
 */
module.exports.readStoryConfig = function readStoryConfig(storyPath, cb) {

};


/**
 * Build story config from YML file
 */
module.exports.buildStoryConfig = function buildStoryConfig(frontMatterContent, cb) {

};


module.exports.getStoryConfig = function getStoryConfig(storyPath, cb) {
  async.waterfall([
    cb => module.exports.readStoryConfig(storyPath, cb),
    (frontMatterContent, cb) => module.exports.buildStoryConfig(frontMatterContent, cb)
  ], cb);
};
