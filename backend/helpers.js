"use strict";


module.exports.isSlug = function isSlug(potentialSlug) {
  return potentialSlug.match(/^[a-z][a-z0-9_]+$/);
};


module.exports.parseYmlCode = function parseYmlCode(codeString, shorthands) {
  return {
    lhs: [],
    operator: '',
    rhs: []
  };
};


/**
 * Validate that a key exists and is of the right type
 * @param object the object containing the key/value
 * @param keyName the name of the object's key to validate
 * @param keyType the type expected for the key, null if no expectations
 * @param msgNotFound string containing the error message if the key does not exist
 * @throws on key does not exist or the type is wrong
 */
module.exports.validateKeyType = function validateKeyType(object, keyName, keyType, msgNotFound) {
  var objectKeyType = typeof object[keyName];
  if(objectKeyType === 'undefined') {
    throw new Error(msgNotFound);
  }
  else if((keyType !== null) && (objectKeyType !== keyType)) {
    throw new Error(keyName + " should be of type '" + keyType + "', not '" + objectKeyType + "'");
  }
}

