"use strict";
const fs = require('fs');


/**
 * Retrieve the YML event for a given event from disk
 * @return raw file content
 */
function readEvent(storyPath, storylineSlug, eventSlug) {
  return fs.readFileSync(`${storyPath}/${storylineSlug}/${eventSlug}`).toString();
}


/**
 * Build event from YML file
 * @param eventContent raw file content
 * @return event object
 */
function buildEvent(eventContent) {
  // TODO
  return {};
}


/**
 * Retrieve the config for a given story
 * @return a complete config
 */
function getEvent(storyPath, storylineSlug, eventSlug) {
  var configContent = readEvent(storyPath, storylineSlug, eventSlug);

  return buildEvent(configContent);
}


module.exports.getEvent = getEvent;
module.exports.readEvent = readEvent;
module.exports.buildEvent = buildEvent;
