"use strict";
const helpers = require('./helpers.js');

const YML_OPERATORS = ['==', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN'];


module.exports.parseCondition = function parseCondition(stringCondition) {
  // TODO
  var condition = helpers.parseYmlCode(stringCondition);

  return condition;
};

module.exports.YML_OPERATORS = YML_OPERATORS;
