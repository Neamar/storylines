#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const Storyline = require('../frontend/storylines.js');

module.exports = function(storyPath, rawPath, dotPath, verbose) {
  let startDate = new Date();
  let totalStories = 0;
  let lastPercentage = 0;

  const stories = new Set();
  const states = new Set();
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


  function serializeState(state) {
    return JSON.stringify(state);
  }


  function deserializeState(serializedState) {
    return JSON.parse(serializedState);
  }

  console.log('Exploring storylines...');
  function walkTree(serializedState, chainOfEvents, depth, leftProgress, rightProgress) {

    let actionsAtThisPoint = currentActions;

    let currentEvent = storyline.currentEvent;
    let currentEventSlug = storyline.getEventSlug(storyline.currentEvent);

    chainOfEvents = chainOfEvents.slice(0);
    chainOfEvents.push(currentEventSlug);

    // If the current event doesn't have any available action,
    // Backtrack
    if (actionsAtThisPoint.length === 0) {
      totalStories += 1;
      stories.add(chainOfEvents.join(','));
      return;
    }

    let stateHash = crypto.createHash('md5').update(serializedState).digest('hex');
    if (states.has(stateHash)) {
      // We've already seen this state before,
      // We don't need to do anything as it's been covered in another iteration
      // console.log('⤦');
      return;
    }
    // Add the current state to known states
    states.add(stateHash);

    actionsAtThisPoint.forEach(function(action, index) {
      // Reset state
      storyline.state = deserializeState(serializedState);
      storyline.currentEvent = currentEvent;

      let progressPercentage = leftProgress + (rightProgress - leftProgress) / actionsAtThisPoint.length * index;
      let nextProgressPercentage = leftProgress + (rightProgress - leftProgress) / actionsAtThisPoint.length * (index + 1);
      if (verbose) {
        console.log(`${' '.repeat(depth * 2)}"${action}" on ${currentEventSlug} (${progressPercentage}%)`);
      }
      if (Math.floor(progressPercentage) !== lastPercentage) {
        lastPercentage = Math.floor(progressPercentage);
        console.log(`Progress: ${lastPercentage}%`);
      }
      // Overwrite original nextEvent function
      storyline.nextEvent = function() {
        // Call original implementation
        // This will pick the next event,
        // update the state
        // and update currentActions with a new event
        storyline._nextEvent();

        // Serialize our new state and recursively keep going
        let serializedState = serializeState(storyline.state);
        walkTree(serializedState, chainOfEvents, depth + 1, progressPercentage, nextProgressPercentage);
      };

      // This will in turn call our custom nextEvent() function
      storyline.respondToEvent(action);
    });
  }


  const chainOfEvents = [];
  const originalSerializedState = serializeState(storyline.state);


  // Walk all the paths!
  walkTree(originalSerializedState, chainOfEvents, 0, 0, 100);

  console.log('Went through all stories, now organizing data.');

  // Free up state memory, we won't need this anymore
  states.clear();

  // Transform the stories (currently, stringified) to a structure that can be dealt with easily
  const allStories = Array.from(stories).map(s => s.split(','));

  // Free up stories set, we won't need it anymore
  stories.clear();

  const allStorylines = storyline.events.reduce((acc, event) => acc.add(event.storyline), new Set());
  if (rawPath) {
    console.log('Writing raw stories');
    fs.writeFileSync(rawPath, JSON.stringify(allStories), null, 2);
  }

  function getDefaultNode() {
    return {
      isEntryPoint: false,
      isExitPoint: false,
      isFinal: false,
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

      // By convention, only detect "exit points" for stories that ended with end/end
      // Other end-states might exist (character death) but we don't want to use them to define exit point
      // as the character might just be halfway through the story when he died.
      if (lastKnownEventInStoryline && story[story.length - 1] === 'end/end') {
        if (!relations[lastKnownEventInStoryline]) {
          relations[lastKnownEventInStoryline] = getDefaultNode();
        }

        relations[lastKnownEventInStoryline].isExitPoint = true;
      }

      // Identify final events too
      let lastEvent = story[story.length - 1];
      if (!relations[lastEvent]) {
        relations[lastEvent] = getDefaultNode();
      }
      if (lastEvent == lastKnownEventInStoryline) {
        relations[lastEvent].isFinal = true;
        relations[lastEvent].isExitPoint = true;
      }

    });
    return relations;
  }

  console.log('And bulding graph.');

  let graph = 'digraph G {';
  allStorylines.forEach(function(storyline) {
    graph += `\nsubgraph cluster_${storyline} {\n
    style=filled;
    color=lightgrey;
    node [style=filled,color=black,shape=box,fillcolor=white];
    label = "${storyline}";\n`;
    const relations = buildRelationsWithinStoryline(storyline);
    Object.keys(relations).forEach(function(from) {
      if (relations[from].isEntryPoint || relations[from].isExitPoint || relations[from].isFinal) {
        let attributes = ['filled'];
        let color = 'black';
        if (relations[from].isEntryPoint) {
          attributes.push('bold');
        }
        if (relations[from].isExitPoint) {
          attributes.push('rounded');
          attributes.push('dotted');
        }
        if (relations[from].isFinal) {
          color = 'red';
        }
        graph += `    "${from}" [style="${attributes.join(',')}",color=${color}]\n`;
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
  console.log(`Generated ${totalStories} stories in ${Math.round((endDate - startDate) / 1000)}s`);
};
