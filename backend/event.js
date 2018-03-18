'use strict';
const fs = require('fs');
const frontMatter = require('front-matter');
var marked = require('marked');

const helpers = require('./helpers');
const conditionsTools = require('./conditions');

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
function buildEvent(eventContent, storylineSlug, eventSlug, storyConfig) {
  if(!frontMatter.test(eventContent)) {
    throw new Error('Event must be a valid FrontMatter file.');
  }

  var fm = frontMatter(eventContent);
  var event = fm.attributes;
  event.description = marked(fm.body).trim();

  // Do some automatic improvements on text
  event.description = event.description.replace(/---/g, '&mdash;');
  event.description = event.description.replace(/--/g, '&ndash;');
  event.description = event.description.replace(/\.\.\./g, '&hellip;');

  if(storyConfig.locale === 'fr_FR') {
    event.description = event.description.replace(/ !/g, '&nbsp;!');
    event.description = event.description.replace(/ \?/g, '&nbsp;?');
    event.description = event.description.replace(/ :/g, '&nbsp;:');
    event.description = event.description.replace(/ ;/g, '&nbsp;;');
    event.description = event.description.replace(/ »/g, '&nbsp;»');
    event.description = event.description.replace(/« /g, '«&nbsp;');
  }

  event.event = eventSlug;
  event.storyline = storylineSlug;
  event.repeatable = event.repeatable || false;
  event.on_display = event.on_display || [];
  return event;
}


function validateTrigger(trigger) {
  helpers.validateKeyType(trigger, 'condition', ['string', 'object'], 'Triggers must include condition');
  helpers.validateKeyType(trigger, 'weight', 'number', null);
}


function validateTriggers(triggersObject) {
  Object.keys(triggersObject || []).forEach(key => {
    if(!TRIGGER_TYPES.includes(key)) {
      throw new Error(`Triggers cannot be '${key}'. Possible types are: ${TRIGGER_TYPES.join(', ')}`);
    }
    validateTrigger(triggersObject[key]);
  });
}


function validateActions(actionsObject) {
  Object.keys(actionsObject || []).forEach(key => {
    helpers.validateKeyType(actionsObject[key], 'operations', 'array', 'Actions must include operations');
    helpers.validateKeyType(actionsObject[key], 'condition', 'array', null);
  });
}


/**
 * Ensure content is correct
 * @param jsonifiedYml YML content from the file
 * @return event object
 * @throws on invalid event
 */
function validateEvent(eventObject) {
  helpers.validateKeyType(eventObject, 'storyline', 'slug', 'Missing storyline slug.');
  helpers.validateKeyType(eventObject, 'event', 'slug', 'Missing event slug.');
  helpers.validateKeyType(eventObject, 'description', 'string', 'Missing event description');
  helpers.validateKeyType(eventObject, 'repeatable', 'boolean', null);

  helpers.validateKeyType(eventObject, 'triggers', 'object', null);
  if(eventObject.triggers) {
    validateTriggers(eventObject.triggers);
  }

  helpers.validateKeyType(eventObject, 'actions', 'object', null);
  if(eventObject.actions) {
    validateActions(eventObject.actions);
  }

  // notFoundmsg is null: don't warn if not found
  helpers.validateKeyType(eventObject, 'on_display', 'array', null);
  return eventObject;
}


function parseTrigger(triggerObject, context) {
  validateTrigger(triggerObject); // this should have been checked by parseTriggers, but what if we call parseTrigger directly?
  triggerObject.condition = conditionsTools.parseCondition(triggerObject.condition, context);
  triggerObject.weight = triggerObject.weight || 1;
  return triggerObject;
}


function parseTriggers(eventObject, context) {
  validateTriggers(eventObject.triggers);

  TRIGGER_TYPES.forEach(type => {
    if(eventObject.triggers && eventObject.triggers[type]) {
      eventObject.triggers[type] = parseTrigger(eventObject.triggers[type], context);
    }
  });
  return eventObject;
}


function parseOperations(actionObject, context) {
  // actionObject can be null: action has no effect, but this will let the engine choose a new event with a soft condition
  if(actionObject && actionObject.operations) {
    actionObject.operations = actionObject.operations.map(o => helpers.parseYmlCode(o, context));
  }
  return actionObject;
}


function parseActionCondition(actionObject, context) {
  // actionObject can be null: action has no effect, but this will let the engine choose a new event with a soft condition
  if(actionObject && actionObject.condition) {
    actionObject.condition = conditionsTools.parseCondition(actionObject.condition, context);
  }
  return actionObject;
}


function parseActions(eventObject, context) {
  if(eventObject.actions) {
    Object.keys(eventObject.actions || []).forEach(actionName => parseOperations(eventObject.actions[actionName], context));
    Object.keys(eventObject.actions || []).forEach(actionName => parseActionCondition(eventObject.actions[actionName], context));
  }
  return eventObject;
}


function parseOnDisplay(eventObject, context) {
  if(eventObject.on_display) {
    eventObject.on_display = eventObject.on_display.map(o => helpers.parseYmlCode(o, context));
  }
  return eventObject;
}


/**
 * Parse content (condition and operations)
 * @param jsonifiedYml YML content from the file
 * @return event object
 * @throws on invalid event
 */
function parseEvent(eventObject) {
  let context = {
    storyline: eventObject.storyline
  };
  parseTriggers(eventObject, context);
  parseActions(eventObject, context);
  parseOnDisplay(eventObject, context);
  return eventObject;
}


/**
 * Retrieve the event for a given story in a given storyline
 * @return a complete event
 */
function getEvent(storyPath, storylineSlug, eventSlug, storyConfig) {
  var eventContent = readEvent(storyPath, storylineSlug, eventSlug);
  var eventObject = buildEvent(eventContent, storylineSlug, eventSlug, storyConfig);
  return parseEvent(eventObject);
}


module.exports.getEvent = getEvent;
module.exports.readEvent = readEvent;
module.exports.buildEvent = buildEvent;
module.exports.validateEvent = validateEvent;
module.exports.parseEvent = parseEvent;
