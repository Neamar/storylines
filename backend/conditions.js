"use strict";
const YML_OPERATORS = ['==', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN'];
module.exports.YML_OPERATORS = YML_OPERATORS;

const helpers = require('./helpers.js');

module.exports.parseCondition = function parseCondition(stringCondition) {
  // TODO
  var condition = helpers.parseYmlCode(stringCondition);

  return condition;
};
