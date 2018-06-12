#!/usr/bin/env node
'use strict';

const fs = require('fs');
const Storyline = require('../frontend/storylines.js');

module.exports = function(storyPath, rawPath, dotPath, verbose) {
  let startDate = new Date();
  let totalStories = 0;

  const stories = new Set();
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


  function walkTree(state, chainOfEvents, depth) {
    totalStories += 1;

    let actionsAtThisPoint = currentActions;

    let currentEvent = storyline.currentEvent;
    let currentEventSlug = storyline.getEventSlug(storyline.currentEvent);

    chainOfEvents = chainOfEvents.slice(0);
    chainOfEvents.push(currentEventSlug);

    // If the current event doesn't have any available action,
    // Backtrack
    if (actionsAtThisPoint.length === 0) {
      stories.add(chainOfEvents.join(','));
      return;
    }

    actionsAtThisPoint.forEach(function(action) {
      // Reset state
      storyline.state = cloneState(state);
      storyline.currentEvent = currentEvent;

      if (verbose) {
        console.log(`${' '.repeat(depth * 2)}"${action}" on ${currentEventSlug}`);
      }
      // Overwrite original nextEvent function
      storyline.nextEvent = function() {
        // Call original implementation
        // This will pick the next event,
        // update the state
        // and update currentActions with a new event
        storyline._nextEvent();

        // Clone our new state and recursively keep going
        let newState = cloneState(storyline.state);
        walkTree(newState, chainOfEvents, depth + 1);
      };

      // This will in turn call our nextEvent() function
      storyline.respondToEvent(action);
    });
  }


  const chainOfEvents = [];
  const originalState = cloneState(storyline.state);


  // Walk all the paths!
  walkTree(originalState, chainOfEvents, 0);

  // Transform the stories (currently, stringified) to a structure that can be dealt with easily
  const allStories = Array.from(stories).map(s => s.split(','));
  const allStorylines = storyline.events.reduce((acc, event) => acc.add(event.storyline), new Set());
  if (rawPath) {
    fs.writeFileSync(rawPath, JSON.stringify(Array.from(stories).map(s => s.split(',')), null, 2));
  }

  function getDefaultNode() {
    return {
      isEntryPoint: false,
      isExitPoint: false,
      direct: new Set(),
      indirect: new Set()
    };
  }
  function buildRelationsWithinStoryline(storyline) {
    const relations = {};
    const storylinePrefix = storyline + '/';
    allStories.forEach(function(story) {
      let lastKnownEventInStoryline = null;
      let lastEventWasInStoryline = false;
      story.forEach(function(event) {
        if (event.startsWith(storylinePrefix)) {
          if (!lastKnownEventInStoryline) {
            // Initial event
            lastKnownEventInStoryline = event;
            lastEventWasInStoryline = true;

            if (!relations[event]) {
              relations[event] = getDefaultNode();
            }
            relations[event].isEntryPoint = true;
            return;
          }

          if (!relations[lastKnownEventInStoryline]) {
            relations[lastKnownEventInStoryline] = getDefaultNode();
          }

          if (lastEventWasInStoryline) {
            relations[lastKnownEventInStoryline].direct.add(event);
          }
          else {
            relations[lastKnownEventInStoryline].indirect.add(event);
          }
          lastKnownEventInStoryline = event;
          lastEventWasInStoryline = true;
        }
        else {
          lastEventWasInStoryline = false;
        }
      });

      if (lastKnownEventInStoryline) {
        if (!relations[lastKnownEventInStoryline]) {
          relations[lastKnownEventInStoryline] = getDefaultNode();
        }

        relations[lastKnownEventInStoryline].isExitPoint = true;
      }
    });
    return relations;
  }

  let graph = 'digraph G {';
  allStorylines.forEach(function(storyline) {
    graph += `\nsubgraph cluster_${storyline} {\n
    style=filled;
    color=lightgrey;
    node [style=filled,color=black,shape=box,fillcolor=white];
    label = "${storyline}";\n`;
    const relations = buildRelationsWithinStoryline(storyline);
    Object.keys(relations).forEach(function(from) {
      if (relations[from].isEntryPoint || relations[from].isExitPoint) {
        let attributes = ['filled'];
        if (relations[from].isEntryPoint) {
          attributes.push('bold');
        }
        if (relations[from].isExitPoint) {
          attributes.push('rounded');
          attributes.push('dotted');
        }
        graph += `    "${from}" [style="${attributes.join(',')}"]\n`;
      }

      Array.from(relations[from].direct).forEach(function(to) {
        // Skip direct edges that are sometimes indirect
        if (!relations[from].indirect.has(to)) {
          graph += `    "${from}" -> "${to}"\n`;
        }
      });

      Array.from(relations[from].indirect).forEach(function(to) {
        graph += `    "${from}" -> "${to}" [style="dashed"];\n`;
      });
    });
    graph += '}';
  });

  graph += '}';


  if (dotPath) {
    fs.writeFileSync(dotPath, graph);
  }
  else {
    console.log(graph);
  }

  let endDate = new Date();
  console.log(`Generated ${totalStories} stories in ${endDate - startDate}ms`);
};
