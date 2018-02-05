"use strict";
const YML_OPERATORS = ['==', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN'];
module.exports.YML_OPERATORS = YML_OPERATORS;

const helpers = require('./helpers.js');

module.exports.parseCondition = function parseCondition(stringCondition) {
  var condition = helpers.parseYmlCode(stringCondition);
  if(!YML_OPERATORS.includes(condition.operator)) {
    throw new Error("Invalid operator: " + condition.operator);
  }
  return condition;
};
