#!/usr/bin/env node
'use strict';

const fs = require('fs');
const Storyline = require('../frontend/storylines.js');

module.exports = function(storyPath, rawPath, dotPath) {
  const paths = {};
  const story = JSON.parse(fs.readFileSync(storyPath).toString());
  let currentActions = [];
  const callbacks = {
    displayEvent: function(event, actions) {
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

    if (!paths[currentEventSlug]) {
      paths[currentEventSlug] = {};
    }

    actionsAtThisPoint.forEach(function(action) {
      // Reset state
      storyline.state = cloneState(state);
      storyline.currentEvent = currentEvent;

      console.log(`Selecting "${action}" on ${currentEventSlug}`, JSON.stringify(chainOfEvents), state);
      // Overwrite original nextEvent function
      storyline.nextEvent = function() {
        let hardEvents = storyline.listAvailableHardEvents();

        if (hardEvents.length > 0) {
          if (!paths[currentEventSlug][action]) {
            paths[currentEventSlug][action] = {};
          }

          let newEventSlug = storyline.getEventSlug(hardEvents[0]);
          if (!paths[currentEventSlug][action][newEventSlug] || paths[currentEventSlug][action][newEventSlug].length > chainOfEvents.length) {
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

  if (rawPath) {
    fs.writeFileSync(rawPath, JSON.stringify(paths, null, 2));
  }

  let graph = 'digraph G {\n';
  Object.keys(paths).forEach(function(from) {
    Object.keys(paths[from]).forEach(function(transition) {
      Object.keys(paths[from][transition]).forEach(function(to) {
        graph += `  "${from}" -> "${to}"\n`;
      });
    });
  });

  graph += '}';


  if (dotPath) {
    fs.writeFileSync(dotPath, graph);
  }
  else {
    console.log(graph);
  }
};
