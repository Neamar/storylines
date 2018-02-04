"use strict";
const helpers = require('./helpers.js');

const YML_OPERATORS = ['=', '+=', '-=', '/=', '%=', 'APPEND TO', 'REMOVE FROM'];


module.exports.parseOperation = function parseOperation(stringOperation) {
  var operation = helpers.parseYmlCode(stringOperation);
  // TODO
  return operation;
};

module.exports.YML_OPERATORS = YML_OPERATORS;
