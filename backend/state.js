'use strict';


module.exports.generateDefaultState = function generateDefaultState(resources, storylineSlugs) {
  /* jshint unused:false */
  var defaultResources = {};
  Object.keys(resources || []).forEach(key => defaultResources[key] = resources[key].default);
  var defaultStorylines = {};
  storylineSlugs.forEach(key => defaultStorylines[key] = {});
  return {
    global: {
    },
    resources: defaultResources,
    storylines: defaultStorylines
  };
};
