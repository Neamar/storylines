"use strict";
const YML_OPERATORS = ['=', '+=', '-=', '*=', '/=', '%=', 'APPEND TO', 'REMOVE FROM'];
module.exports.YML_OPERATORS = YML_OPERATORS;

const helpers = require('./helpers.js');


module.exports.parseOperation = function parseOperation(stringOperation) {
  var operation = helpers.parseYmlCode(stringOperation);
  // TODO
  return operation;
};
