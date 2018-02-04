"use strict";
const fs = require('fs');
const frontMatter = require('front-matter');

const helpers = require('./helpers');

const TRIGGER_TYPES = ['hard', 'soft'];

/**
 * Retrieve the YML for a given event from disk
 * @return raw file content
 */
function readEvent(storyPath, storylineSlug, eventSlug) {
  return fs.readFileSync(`${storyPath}/${storylineSlug}/${eventSlug}.md`).toString();
}


/**
 * Build event from YML file
 * @param eventContent raw file content
 * @return event object
 */
function buildEvent(eventContent, storylineSlug, eventSlug) {
  if(!frontMatter.test(eventContent)) {
    throw new Error("Event must be a valid FrontMatter file.");
  }

  var fm = frontMatter(eventContent);
  var event = fm.attributes;
  event.description = fm.body.trim();
  event.event = eventSlug;
  event.storyline = storylineSlug;
  return event;
}


function validateTriggers(triggersObject) {
  var keys = Object.keys(triggersObject);
  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var trigger = triggersObject[key];

    if(!TRIGGER_TYPES.includes(key)) {
      throw new Error("Triggers cannot be '" + key + "'. Possible types are: " + TRIGGER_TYPES.join(", "));
    }

    helpers.validateKeyType(trigger, "conditions", "object", "Triggers must include conditions");
    helpers.validateKeyType(trigger, "weight", "number", "Triggers must include a weight");
  }
}


function validateActions(actionsObject) {
  var keys = Object.keys(actionsObject);
  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var action = actionsObject[key];
    helpers.validateKeyType(action, "operations", "array", "Actions must include operations");
  }
}


/**
 * Ensure content is correct
 * @param jsonifiedYml YML content from the file
 * @return event object
 * @throws on invalid event
 */
function validateEvent(eventObject) {
  helpers.validateKeyType(eventObject, "storyline", "slug", "Missing storyline slug.");
  helpers.validateKeyType(eventObject, "event", "slug", "Missing event slug.");
  helpers.validateKeyType(eventObject, "description", "string", "Missing event description");

  var triggers = eventObject.triggers;
  if(triggers !== undefined) {
    validateTriggers(eventObject.triggers);
  }

  var actions = eventObject.actions;
  if(actions !== undefined) {
    validateActions(eventObject.actions);
  }
  return eventObject;
}


/**
 * Parse content (conditions and operations)
 * @param jsonifiedYml YML content from the file
 * @return event object
 * @throws on invalid event
 */
function parseEvent(jsonifiedYml) {

  // TODO
  return jsonifiedYml;
}


/**
 * Retrieve the event for a given story in a given storyline
 * @return a complete event
 */
function getEvent(storyPath, storylineSlug, eventSlug) {
  var eventContent = readEvent(storyPath, storylineSlug, eventSlug);

  var jsonifiedYml = buildEvent(eventContent, storylineSlug, eventSlug);

  var event = validateEvent(jsonifiedYml);
  event = parseEvent(event);

  return event;
}


module.exports.getEvent = getEvent;
module.exports.readEvent = readEvent;
module.exports.buildEvent = buildEvent;
module.exports.validateEvent = validateEvent;
module.exports.parseEvent = parseEvent;
