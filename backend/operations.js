"use strict";
module.exports.YML_OPERATORS = const YML_OPERATORS = ['=', '+=', '-=', '/=', '%=', 'APPEND TO', 'REMOVE FROM'];

const helpers = require('./helpers.js');


module.exports.parseOperation = function parseOperation(stringOperation) {
  var operation = helpers.parseYmlCode(stringOperation);
  // TODO
  return operation;
};
