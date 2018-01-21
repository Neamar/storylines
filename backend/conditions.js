"use strict";
const helpers = require('./helpers.js');


module.exports.parseCondition = function parseCondition(stringCondition) {
  // TODO
  var condition = helpers.parseYmlCode(stringCondition);

  return condition;
};
