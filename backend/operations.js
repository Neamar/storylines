"use strict";
const helpers = require('./helpers.js');


module.exports.parseOperation = function parseOperation(stringOperation) {
  var operation = helpers.parseYmlCode(stringOperation);
  // TODO
  return operation;
};
