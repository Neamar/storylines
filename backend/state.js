"use strict";


module.exports.generateDefaultState = function generateDefaultState(resources, storylineSlugs) {
  if(resources === null) {
    console.log("This is here to shut the linter up");
  }
  if(storylineSlugs === null) {
    console.log("This is here to shut the linter up");
  }
  return {
    global: {
      current_turn: 0,
    },
    resources: {},
    storylines: {}
  };
};
