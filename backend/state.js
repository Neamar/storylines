"use strict";


module.exports.generateDefaultState = function generateDefaultState(resources, storylineSlugs) {
  return {
    global: {
      current_turn: 0,
    },
    resources: {},
    storylines: {}
  };
};
