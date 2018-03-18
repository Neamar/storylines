#!/usr/bin/env node
'use strict';

const fs = require("fs");
const Storyline = require('../frontend/storylines.js');

if(process.argv.length < 3) {
  throw new Error('Invalid call. Usage: npm run fuzzer --  path/to/story [path_to_raw] [path_to_dot_file]');
}

const paths = {};
const story = JSON.parse(fs.readFileSync(process.argv[2]).toString());
let currentActions = [];
const callbacks = {
  displayEvent:  function(event, actions) {
    currentActions = actions;
  },
  displayResources: function() {}
};
const storyline = new Storyline(story, callbacks);
storyline._nextEvent = storyline.nextEvent;
storyline.start();


function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}


function walkTree(state, chainOfEvents) {
  let actionsAtThisPoint = currentActions;

  let currentEvent = storyline.currentEvent;
  let currentEventSlug = storyline.getEventSlug(storyline.currentEvent);

  chainOfEvents = chainOfEvents.slice(0);
  chainOfEvents.push(currentEventSlug);

  if(!paths[currentEventSlug]) {
    paths[currentEventSlug] = {};
  }

  actionsAtThisPoint.forEach(function(action) {
    // Reset state
    storyline.state = cloneState(state);
    storyline.currentEvent = currentEvent;

    console.log(`Selecting "${action}" on ${currentEventSlug}`, JSON.stringify(chainOfEvents.map(e => e.replace(/[^/]+/, ''))), state);
    // Overwrite original nextEvent function
    storyline.nextEvent = function() {
      let hardEvents = storyline.listAvailableHardEvents();

      if(hardEvents.length > 0) {
        if(!paths[currentEventSlug][action]) {
          paths[currentEventSlug][action] = {};
        }

        let newEventSlug = storyline.getEventSlug(hardEvents[0]);
        if(!paths[currentEventSlug][action][newEventSlug] || paths[currentEventSlug][action][newEventSlug].length > chainOfEvents.length) {
          paths[currentEventSlug][action][newEventSlug] = chainOfEvents;
        }
      }

      // Call original implementation
      storyline._nextEvent();

      let newState = cloneState(storyline.state);
      walkTree(newState, chainOfEvents);
    };

    storyline.respondToEvent(action);
  });
}


const chainOfEvents = [];
const originalState = cloneState(storyline.state);


walkTree(originalState, chainOfEvents);

if(process.argv.length > 3) {
  fs.writeFileSync(process.argv[3], JSON.stringify(paths, null, 2));
}

let graph = "digraph G {\n";
Object.keys(paths).forEach(function(from) {
  Object.keys(paths[from]).forEach(function(transition) {
    Object.keys(paths[from][transition]).forEach(function(to) {
      graph += `  "${from}" -> "${to}"\n`;
    });
  });
});

graph += "}";


if(process.argv.length > 4) {
  fs.writeFileSync(process.argv[4], graph);
}
