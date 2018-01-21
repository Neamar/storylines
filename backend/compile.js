"use strict";

var configTools = require("./config");
var storylineTools = require("./storyline");
var eventTools = require("./event");
if(process.argv.length !== 3) {
  throw new Error("Invalid call. Usage: node compile.js path/to/story");
}

const STORY_PATH = process.argv[2];
const STORY_CONFIG_FILE = '/storyline.config';
const STORYLINES_FOLDER = '/storylines';


// Story components
var storyEvents = [];
var storyConfig;


// Build story config
storyConfig = configTools.getConfig(STORY_PATH, STORY_CONFIG_FILE);



// Build all events
var storylinesSlugs = storylineTools.getStorylinesSlugs(STORY_PATH, STORYLINES_FOLDER);
storylinesSlugs.forEach(function(storylineSlug) {
  var eventsSlugs = storylineTools.getEventsSlugs(STORY_PATH, storylineSlug);

  var storylineEvents = eventsSlugs.map(function(eventSlug) {
    return eventTools.getEvent(STORY_PATH, storylineSlug, eventSlug);
  });

  storyEvents = storyEvents.concat(storylineEvents);
});


// Build story bundle
storyConfig.events = storyEvents;
