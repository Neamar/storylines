'use strict';
/*jshint latedef: nofunc */

const operations = require('./operations.js');
const conditions = require('./conditions.js');


const YML_ALL_OPERATORS = conditions.YML_OPERATORS.concat(operations.YML_OPERATORS);

const ARG_TYPE_NULL           = 0;
const ARG_TYPE_BOOLEAN        = 1;
const ARG_TYPE_NUMERAL        = 2;
const ARG_TYPE_STRING         = 3;
const ARG_TYPE_ARRAY          = 4;
const ARG_TYPE_STATE_ACCESS   = 5;

const ARG_NULL_VALS  = ['NULL', 'null', 'Null', 'NONE', 'none', 'None'];
const ARG_VALS_FALSE = ['FALSE', 'false', 'False'];
const ARG_VALS_TRUE  = ['TRUE', 'true', 'True'];
const ARG_BOOLEAN_VALS = ARG_VALS_TRUE.concat(ARG_VALS_FALSE);

// In the next 3 arrays, the first element is the name that will be used to replace all the others
const ARG_STATE_LEVEL_GLOBAL            = ['global', 'g'];
const ARG_STATE_LEVEL_RESOURCES         = ['resources', 'r'];
const ARG_STATE_LEVEL_STORYLINES        = ['storylines', 's'];
const ARG_STATE_LEVEL_CURRENT_STORYLINE = ['sl']; // This is replaced in the handling code
const ARG_STATE_FIRST_LEVEL = ARG_STATE_LEVEL_GLOBAL.concat(ARG_STATE_LEVEL_RESOURCES).concat(ARG_STATE_LEVEL_STORYLINES).concat(ARG_STATE_LEVEL_CURRENT_STORYLINE);

const SLUG_REGEX = /^[a-z][a-z0-9_]*$/;

function strip(stripList, string) {
  var beginIndex = 0;
  var  endIndex = string.length - 1;

  while(stripList.includes(string[beginIndex])) {
    beginIndex += 1;
  }
  if(beginIndex >= endIndex) {
    return '';
  }
  while(stripList.includes(string[endIndex])) {
    endIndex -= 1;
  }
  return string.substring(beginIndex, endIndex + 1);
}


function isSlug(potentialSlug) {
  return typeof potentialSlug === 'string' && potentialSlug.match(SLUG_REGEX);
}


// ARG_TYPE_STRING
function isStr(arg) {
  return ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith("'") && arg.endsWith("'")));
}


function isArray(arg) {
  return ((arg.startsWith('[') && arg.endsWith(']')));
}


function isStateAccess(arg) {
  var keys = arg.trim().split('.');
  if(keys.length < 2) {
    return false;
  }
  for(var i = 1; i < keys.length; i += 1) {
    if(!isSlug(keys[i]) && isNaN(keys[i])) {
      return false;
    }
  }
  return true;
}


function findOperator(codeString) {
  // For now, at least, we suppose there is at least one space before and after the operator
  // 'IN' is included in 'NOT IN' so we need to look for the longer match (if one contains the other)
  var candidates = YML_ALL_OPERATORS.filter(op => codeString.includes(' ' + op + ' ')).sort((op1, op2) => op1.length - op2.length);

  if(candidates.length === 0) {
    throw new Error('Could not find the operator. Please make sure to delimit it with spaces. Valid operators are: ' + YML_ALL_OPERATORS.join(', '));
  }
  else if(candidates.length === 1) {
    return candidates[0];
  }
  else {
    var candidate = candidates[candidates.length - 1];
    for(var i = 0; i < candidates.length; i += 1) {
      var candidateBegin = codeString.indexOf(' ' + candidate + ' ');
      var candidateEnd = candidateBegin + candidate.length - 1;
      var currentBegin = codeString.indexOf(' ' + candidates[i] + ' ');
      var currentStart = currentBegin + candidates[i].length - 1;

      if(!((candidateBegin <= currentBegin) && (candidateEnd >= currentStart))) {
        throw new Error('Too many operator candidates: ' + candidates);
      }

      // All other candidates were contained in this one, this is the one we want
      return candidate;
    }
  }
}


function getArgType(arg) {
  if(ARG_NULL_VALS.includes(arg)) {
    return ARG_TYPE_NULL;
  }
  if(ARG_BOOLEAN_VALS.includes(arg)) {
    return ARG_TYPE_BOOLEAN;
  }
  if(!isNaN(arg - parseFloat(arg))) {
    return ARG_TYPE_NUMERAL;
  }
  if(isStr(arg)) {
    return ARG_TYPE_STRING;
  }
  if(isArray(arg)) {
    return ARG_TYPE_ARRAY;
  }
  if(isStateAccess(arg)) {
    return ARG_TYPE_STATE_ACCESS;
  }
  return null;
}


// ARG_TYPE_BOOLEAN
function getBooleanArg(arg) {
  if(ARG_VALS_TRUE.includes(arg)) {
    return true;
  }
  else if(ARG_VALS_FALSE.includes(arg)) {
    return false;
  }
  else {
    throw new Error(`Invalid boolean expression: ${arg}`);
  }
}


function isValidStr(arg) {
  var strDelimiter = arg.charAt(0);

  if(strip([strDelimiter], arg).includes(strDelimiter)) {
    return false;
  }
  return true;
}


function getStrArg(arg) {
  if(!isValidStr(arg)) {
    throw new Error(`${arg} is an invalid string expression`);
  }
  return strip(['\'', '\''], arg);
}


// ARG_TYPE_ARRAY
function getArray(arg, context) {
  arg = strip(['[', ']'], arg.trim()).trim();
  if(arg === '') {
    // This has to be here, because ''.split(',') returns '['']', not '[]'...
    return [];
  }
  return arg.split(',').map(x => getArg(x.trim(), context));
}


function getArrayArg(arg, context) {
  return getArray(arg, context);
}


// ARG_TYPE_STATE_ACCESS
function getStateAccess(arg, context) {
  var keys = arg.trim().split('.');

  if(ARG_STATE_LEVEL_GLOBAL.includes(keys[0])) {
    keys[0] = ARG_STATE_LEVEL_GLOBAL[0];
  }
  else if(ARG_STATE_LEVEL_RESOURCES.includes(keys[0])) {
    keys[0] = ARG_STATE_LEVEL_RESOURCES[0];
  }
  else if(ARG_STATE_LEVEL_STORYLINES.includes(keys[0])) {
    keys[0] = ARG_STATE_LEVEL_STORYLINES[0];
  }
  else if(ARG_STATE_LEVEL_CURRENT_STORYLINE.includes(keys[0])) {
    keys[0] = 'storylines';
    keys.splice(1, 0, context.storyline);
  }
  else {
    throw new Error(`First-Level must be one of ${ARG_STATE_FIRST_LEVEL}, not ${keys[0]}`);
  }
  return {'_type': 'state', 'data': keys};
}


function getArg(arg, context) {
  switch(getArgType(arg)) {
    case ARG_TYPE_NULL:
      return null;
    case ARG_TYPE_BOOLEAN:
      return getBooleanArg(arg);
    case ARG_TYPE_NUMERAL:
      return parseFloat(arg);
    case ARG_TYPE_STRING:
      return getStrArg(arg);
    case ARG_TYPE_ARRAY:
      return getArrayArg(arg, context);
    case ARG_TYPE_STATE_ACCESS:
      return getStateAccess(arg, context);
    default:
      throw new Error(`Invalid expression '${arg}'`);
  }
}


function parseYmlCode(codeString, context) {
  // For now, at least, we suppose there is at least one whitespace before and after the operators
  var operator = findOperator(codeString);
  var lhs;
  var rhs;
  [lhs, rhs] = codeString.split(operator).map(x => x.trim());
  if(lhs === '') {
    throw new Error('Missing left-hand side');
  }
  if(rhs === '') {
    throw new Error('Missing right-hand side');
  }
  lhs = getArg(lhs, context);
  rhs = getArg(rhs, context);

  return {
    lhs: lhs,
    operator: operator,
    rhs: rhs
  };
}


/**
 * Validate that a key exists and is of the right type
 * @param object the object containing the key/value
 * @param keyName the name of the object's key to validate
 * @param keyType the type expected for the key, null if no expectations
 * @param msgNotFound string containing the error message if the key does not exist
 * @throws on key does not exist or the type is wrong
 */
function validateKeyType(object, keyName, keyType, msgNotFound) {
  var objectKeyType = typeof object[keyName];
  if(objectKeyType === 'undefined') {
    if(msgNotFound === null) {
      // User has instructed not to warn when not found
      return;
    }
    throw new Error(msgNotFound || `'${keyName}' doesn't exist`);
  }


  if(isSlug(object[keyName])) {
    objectKeyType = 'slug';
  }
  else if(Array.isArray(object[keyName])) {
    objectKeyType = 'array';
  }

  if((keyType !== null) && !((objectKeyType === keyType) || (Array.isArray(keyType) && keyType.includes(objectKeyType)))) {
    throw new Error(`${keyName} should be of type '${keyType}', not '${objectKeyType}'`);
  }
}

module.exports.isSlug = isSlug;
module.exports.getArgType = getArgType;
module.exports.getBooleanArg = getBooleanArg;
module.exports.parseYmlCode = parseYmlCode;
module.exports.validateKeyType = validateKeyType;
