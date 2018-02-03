"use strict";
// var fs = require("fs");


/**
 * Retrieve all the storylines available within `storyPath`
 * @return an array of each storyline slug
 */
function getStorylinesSlugs(storyPath, storylinesFolder) {
  /*jshint unused:false */
  // TODO, using fs.readdirSync()
  return [];
}


/**
 * Retrieve all the events available within the specified storyline
 * @return an array of each storyline slug
 */
function getEventsSlugs(storyPath, storylinesFolder, storylineSlug) {
  /*jshint unused:false */
  // TODO, using fs.readdirSync() and listing all .md files
  return [];
}


module.exports.getStorylinesSlugs = getStorylinesSlugs;
module.exports.getEventsSlugs = getEventsSlugs;
