"use strict";
const fs = require("fs");


/**
 * Retrieve all the storylines available within `storyPath`
 * @return an array of each storyline slug
 */
function getStorylinesSlugs(storyPath, storylinesFolder) {
  // TODO, using fs.readdirSync()
  return [];
}


/**
 * Retrieve all the events available within the specified storyline
 * @return an array of each storyline slug
 */
function getEventsSlugs(storyPath, storylinesFolder, storylineSlug) {
  // TODO, using fs.readdirSync()
  return [];
}


module.exports.getStorylinesSlugs = getStorylinesSlugs;
module.exports.getEventsSlugs = getEventsSlugs;
