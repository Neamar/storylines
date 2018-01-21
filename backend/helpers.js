"use strict";


module.exports.isSlug = function isSlug(potentialSlug) {
  return potentialSlug.match(/^[a-z][a-z0-9_]+$/);
};


module.exports.parseYmlCode = function parseYmlCode(codeString) {
  return {
    lhs: [],
    operator: '',
    rhs: []
  };
};
