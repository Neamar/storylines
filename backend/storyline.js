'use strict';
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');


function isValidDir(dirpath) {
  try {
    return (fs.lstatSync(dirpath)).isDirectory();
  } catch(e) {
    if(e.code === 'ENOENT') {
      return false;
    }
    throw e;
  }
}


/**
 * Retrieve all the storylines available within `storyPath`
 * @return an array of every storyline slug
 */
function getStorylinesSlugs(storyPath, storylinesFolder) {
  var dir = path.join(storyPath, storylinesFolder);
  if(!isValidDir(dir)) {
    throw new Error(`${dir} is not a valid directory`);
  }
  return fs.readdirSync(dir).filter(name => helpers.isSlug(name) && (fs.lstatSync(path.join(dir, name)).isDirectory()));
}


/**
 * Retrieve all the events available within the specified storyline
 * @return an array of every event slug
 */
function getEventsSlugs(storyPath, storylinesFolder, storylineSlug) {
  var dir = path.join(storyPath, storylinesFolder, storylineSlug);

  if(!helpers.isSlug(storylineSlug)) {
    throw new Error(`${storylineSlug} is not a slug`);
  }

  if(!isValidDir(dir)) {
    throw new Error(`${dir} is not a valid directory`);
  }

  return fs.readdirSync(`${storyPath}/${storylinesFolder}/${storylineSlug}`).filter(function(name) {
    var nameParts = name.split('.');
    return (nameParts.length === 2 && helpers.isSlug(nameParts[0]) && nameParts[1] === 'md');
  }).map(name => name.split('.')[0]);
}


module.exports.getStorylinesSlugs = getStorylinesSlugs;
module.exports.getEventsSlugs = getEventsSlugs;
