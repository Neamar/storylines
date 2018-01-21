"use strict";
const configTools = require("./config");
const storylineTools = require("./storyline");
const eventTools = require("./event");


module.exports = function bundle(storyPath, storyConfigFile, storylinesFolder) {
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
      return eventTools.getEvent(storyPath, storylineSlug, eventSlug);
    });

    storyEvents = storyEvents.concat(storylineEvents);
  });


  // Sort events for consistency
  storyEvents = storyEvents.sort((e1, e2) => {
    if(e1.storyline === e2.storyline) {
      return e1.event > e2.event ? -1 : 1;
    }
    return e1.storyline > e2.storyline ? -1 : 1;
  });


  // Build story bundle
  storyConfig.events = storyEvents;

  return storyConfig;
};
