"use strict";
module.exports.YML_OPERATORS = const YML_OPERATORS = ['==', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN'];

const helpers = require('./helpers.js');

module.exports.parseCondition = function parseCondition(stringCondition) {
  // TODO
  var condition = helpers.parseYmlCode(stringCondition);

  return condition;
};
