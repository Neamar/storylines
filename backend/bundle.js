"use strict";
const path = require("path");
const configTools = require("./config");
const storylineTools = require("./storyline");
const eventTools = require("./event");
const stateTools = require("./state");


function storyBundle(storyPath, storyConfigFile, storylinesFolder) {
  // Story components
  var storyEvents = [];
  var storyConfig;

  // Build story config
  storyConfig = configTools.getConfig(storyPath, storyConfigFile);

  // Build all events
  var storylinesSlugs = storylineTools.getStorylinesSlugs(storyPath, storylinesFolder);
  storylinesSlugs.forEach(function(storylineSlug) {
    var eventsSlugs = storylineTools.getEventsSlugs(storyPath, storylinesFolder, storylineSlug);
    var storylineEvents = eventsSlugs.map(function(eventSlug) {
      return eventTools.getEvent(path.join(storyPath, storylinesFolder), storylineSlug, eventSlug);
    });
    storyEvents = storyEvents.concat(storylineEvents);
  });

  // Sort events for consistency
  storyEvents = storyEvents.sort((e1, e2) => {
    if(e1.storyline === e2.storyline) {
      return e1.event > e2.event ? 1 : -1;
    }
    return e1.storyline > e2.storyline ? 1 : -1;
  });

  // Add events to bundle
  storyConfig.events = storyEvents;

  // Generate default state
  storyConfig.default_state = stateTools.generateDefaultState(storyConfig.resources, storylinesSlugs);

  // "Stamp" the story (makes searching within Github easier)
  storyConfig._source = "https://github.com/Neamar/storylines";
  return storyConfig;
}

module.exports.storyBundle = storyBundle;
