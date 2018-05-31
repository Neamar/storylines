#!/usr/bin/env node
'use strict';

const fs = require('fs');
const Storyline = require('../frontend/storylines.js');

module.exports = function(storyPath, rawPath, dotPath) {
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
    let actionsAtThisPoint = currentActions;

    let currentEvent = storyline.currentEvent;
    let currentEventSlug = storyline.getEventSlug(storyline.currentEvent);

    chainOfEvents = chainOfEvents.slice(0);
    chainOfEvents.push(currentEventSlug);

    // If we can't do anything anymore, just store the story and backtrack
    if (actionsAtThisPoint.length === 0) {
      stories.add(chainOfEvents.join(','));
      return;
    }

    actionsAtThisPoint.forEach(function(action) {
      // Reset state
      storyline.state = cloneState(state);
      storyline.currentEvent = currentEvent;

      console.log(`${' '.repeat(depth * 2)}"${action}" on ${currentEventSlug}`);
      // Overwrite original nextEvent function
      storyline.nextEvent = function() {
        // Call original implementation
        storyline._nextEvent();

        // Clone our state and recursively keep going
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

  console.log(stories);
  // Transform the stories (currently, stringified) to a structure that can be dealt with easily
  const allStories = Array.from(stories).map(s => s.split(','));
  const allStorylines = storyline.events.reduce((acc, event) => acc.add(event.storyline), new Set());
  if (rawPath) {
    fs.writeFileSync(rawPath, JSON.stringify(Array.from(stories).map(s => s.split(',')), null, 2));
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
            return;
          }

          if (!relations[lastKnownEventInStoryline]) {
            relations[lastKnownEventInStoryline] = {
              direct: new Set(),
              indirect: new Set()
            };
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
    });
    return relations;
  }

  let graph = 'digraph G {';
  allStorylines.forEach(function(storyline) {
    graph += `\nsubgraph cluster_${storyline} {\n
    style=filled;
    color=lightgrey;
    node [style=filled,color=white];
    label = "${storyline}";\n`;
    const relations = buildRelationsWithinStoryline(storyline);
    Object.keys(relations).forEach(function(from) {
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
};
