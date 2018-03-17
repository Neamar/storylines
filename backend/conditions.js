"use strict";
const YML_OPERATORS = ['==', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN'];
module.exports.YML_OPERATORS = YML_OPERATORS;

const BOOLEAN_OPERATORS = ['AND', 'OR'];

const helpers = require('./helpers.js');

module.exports.parseCondition = function parseCondition(input, context) {
  if((typeof input) === 'string') {
    var condition = helpers.parseYmlCode(input, context);
    if(!YML_OPERATORS.includes(condition.operator)) {
      throw new Error("Invalid operator: " + condition.operator);
    }
    condition._type = 'atomic_condition';
    return condition;
  }
  else if(typeof input !== "object") {
    throw new Error("Conditions must be either a string or an object.");
  }

  var keys = Object.keys(input);
  if(!(keys.length === 1 && BOOLEAN_OPERATORS.includes(keys[0]))) {
    throw new Error("Condition objects must be one and only one of " + BOOLEAN_OPERATORS.join(', ') + " not " + keys[0]);
  }
  var op = keys[0];
  var results = {_type: 'propositional_condition', boolean_operator: op};
  results.conditions = input[op].map(x => parseCondition(x, context));
  return results;
};
