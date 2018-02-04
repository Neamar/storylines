"use strict";
const YML_OPERATORS = ['=', '+=', '-=', '/=', '%=', 'APPEND TO', 'REMOVE FROM'];
module.exports.YML_OPERATORS = YML_OPERATORS;

const helpers = require('./helpers.js');


module.exports.parseOperation = function parseOperation(stringOperation) {
  var operation = helpers.parseYmlCode(stringOperation);

  if(!YML_OPERATORS.includes(operation.operator)) {
    throw new Error("Invalid operator: " + operation.operator);
  }

  if(operation.lhs._type !== "state") {
    throw new Error("Left-hand side in operations must be a state access.");
  }

  return operation;
};
