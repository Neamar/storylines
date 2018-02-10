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
  event.repeatable = event.repeatable || false;
  event.on_display = [];
  return event;
}


function validateTrigger(trigger) {
  helpers.validateKeyType(trigger, "conditions", "array", "Triggers must include conditions");
  helpers.validateKeyType(trigger, "weight", "number", "Triggers must include a weight");
}


function validateTriggers(triggersObject) {
  Object.keys(triggersObject || []).forEach(key => {
    if(!TRIGGER_TYPES.includes(key)) {
      throw new Error("Triggers cannot be '" + key + "'. Possible types are: " + TRIGGER_TYPES.join(", "));
    }
    validateTrigger(triggersObject[key]);
  });
}


function validateActions(actionsObject) {
  Object.keys(actionsObject || []).forEach(key => {
      helpers.validateKeyType(actionsObject[key], "operations", "array", "Actions must include operations");
      helpers.validateKeyType(actionsObject[key], "conditions", "array", null);
    }
  );
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
  helpers.validateKeyType(eventObject, "repeatable", "boolean", null);

  if(eventObject.triggers) {
    validateTriggers(eventObject.triggers);
  }

  helpers.validateKeyType(eventObject, "actions", "object", null);
  if(eventObject.actions) {
    validateActions(eventObject.actions);
  }

  // notFoundmsg is null: don't warn if not found
  helpers.validateKeyType(eventObject, "on_display", "array", null);
  return eventObject;
}


function parseTrigger(triggerObject) {
  validateTrigger(triggerObject); // this should have been checked by parseTriggers, but what if we call parseTrigger directly?
  triggerObject.conditions = triggerObject.conditions.map(helpers.parseYmlCode);
  return triggerObject;
}


function parseTriggers(eventObject) {
  validateTriggers(eventObject.triggers);

  TRIGGER_TYPES.forEach(type => {
    if(eventObject.triggers && eventObject.triggers[type]) {
      eventObject.triggers[type] = parseTrigger(eventObject.triggers[type]);
    }
  });
  return eventObject;
}


function parseOperations(actionObject) {
  if(actionObject.operations) {
    actionObject.operations = actionObject.operations.map(helpers.parseYmlCode);
  }
  return actionObject;
}


function parseConditions(actionObject) {
  if(actionObject.conditions) {
    actionObject.conditions = actionObject.conditions.map(helpers.parseYmlCode);
  }
  return actionObject;
}


function parseActions(eventObject) {
  if(eventObject.actions) {
    Object.keys(eventObject.actions || []).forEach(actionName => parseOperations(eventObject.actions[actionName]));
    Object.keys(eventObject.actions || []).forEach(actionName => parseConditions(eventObject.actions[actionName]));
  }
  return eventObject;
}


function parseOnDisplay(eventObject) {
  if(eventObject.on_display) {
    eventObject.on_display = eventObject.on_display.map(helpers.parseYmlCode);
  }
  return eventObject;
}


/**
 * Parse content (conditions and operations)
 * @param jsonifiedYml YML content from the file
 * @return event object
 * @throws on invalid event
 */
function parseEvent(eventObject) {
  parseTriggers(eventObject);
  parseActions(eventObject);
  parseOnDisplay(eventObject);
  return eventObject;
}


/**
 * Retrieve the event for a given story in a given storyline
 * @return a complete event
 */
function getEvent(storyPath, storylineSlug, eventSlug) {
  var eventContent = readEvent(storyPath, storylineSlug, eventSlug);
  var eventObject = buildEvent(eventContent, storylineSlug, eventSlug);
  return parseEvent(eventObject);
}


module.exports.getEvent = getEvent;
module.exports.readEvent = readEvent;
module.exports.buildEvent = buildEvent;
module.exports.validateEvent = validateEvent;
module.exports.parseEvent = parseEvent;
