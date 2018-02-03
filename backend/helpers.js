"use strict";


var YML_CONDITIONS_OPERATORS = ['==', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN'];
var YML_OPERATIONS_OPERATORS = ['=', '+=', '-=', '/=', '%=', 'APPEND TO', 'REMOVE FROM'];
var YML_ALL_OPERATORS = YML_CONDITIONS_OPERATORS.concat(YML_OPERATIONS_OPERATORS);

var ARG_TYPE_NULL           = 0;
var ARG_TYPE_BOOLEAN        = 1;
var ARG_TYPE_NUMERAL        = 2;
var ARG_TYPE_STRING         = 3;
var ARG_TYPE_ARRAY          = 4;
var ARG_TYPE_STATE_ACCESS   = 5;
var ARG_TYPES = [ARG_TYPE_NULL, ARG_TYPE_BOOLEAN, ARG_TYPE_NUMERAL, ARG_TYPE_ARRAY, ARG_TYPE_STRING, ARG_TYPE_STATE_ACCESS];

var ARG_NULL_VALS  = ["NULL", "null", "Null", "NONE", "none", "None"];
var ARG_VALS_FALSE = ["FALSE", "false", "False"];
var ARG_VALS_TRUE  = ["TRUE", "true", "True"];
var ARG_BOOLEAN_VALS = ARG_VALS_TRUE.concat(ARG_VALS_FALSE);
var ARG_STATE_LEVEL_GLOBAL            = ["global", "g"] // To avoid yet another global. the actual name must come first
var ARG_STATE_LEVEL_RESOURCES         = ["resources", "r"]
var ARG_STATE_LEVEL_STORYLINES        = ["storylines", "s"]
var ARG_STATE_LEVEL_CURRENT_STORYLINE = ["sl"]
var ARG_STATE_FIRST_LEVEL = ARG_STATE_LEVEL_GLOBAL.concat(ARG_STATE_LEVEL_RESOURCES).concat(ARG_STATE_LEVEL_STORYLINES).concat(ARG_STATE_LEVEL_CURRENT_STORYLINE)


function indexesOf(string, char) {
  var indexes = [];
  var i = -1;
  while((i=string.indexOf(char), i+1) >= 0) {
    indexes.push(i);
  }
  return indexes;
}


function isSlug(potentialSlug) {
  return potentialSlug.match(/^[a-z][a-z0-9_]*$/);
};
module.exports.isSlug = isSlug;


function findOperator(codeString) {
  // For now, at least, we suppose there is at least one space before and after the operators
  // 'IN' is included in 'NOT IN' so we need to look for the longer match (if one contains the other)
  var candidates = YML_ALL_OPERATORS.filter(op => codeString.indexOf(' ' + op + ' ') !== -1).sort((op1, op2) => op1.length - op2.length);
  var operator;

  if(candidates.length === 0) {
    throw new Error("Could not find the operator. Please make sure to delimit it with spaces. Valid operators are: " + YML_ALL_OPERATORS.join());
  }
  else if(candidates.length === 1) {
    return candidates[0];
  }
  else {
    var candidate = candidates[candidates.length - 1]; 
    console.log(candidate);
    for(var i=0; i < candidates.length; i++) {
      var cand_begin = codeString.indexOf(' ' + candidate + ' ');
      var cand_end = cand_begin + candidate.length - 1;
      var cur_begin = codeString.indexOf(' ' + candidates[i] + ' ');
      var cur_end = cur_begin + candidates[i].length - 1;
    
      if(!((cand_begin <= cur_begin) && (cand_end >= cur_end))) {
        throw new Error("Too many operator candidates: " + candidates);
      }
    // All other candidates were contained in this one, this is the one we want
    return candidate;
    }
  }
}


function getArgType(arg) {
  if(ARG_NULL_VALS.indexOf(arg) !== -1) {
    return ARG_TYPE_NULL;
  }
  if(ARG_BOOLEAN_VALS.indexOf(arg) !== -1) {
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
function isBoolean(arg) {
  return (ARG_VALS_TRUE.indexOf(arg) !== -1) || (ARG_VALS_FALSE.indexOf(arg) !== -1)
}


function getBooleanArg(arg) {
  if(ARG_VALS_TRUE.indexOf(arg) !== -1) {
    return true;
  }
  else if(ARG_VALS_FALSE.indexOf(arg) !== -1) {
    return false;
  }
  else {
    throw new Error("Invalid boolean expression: '" + arg + "'");
  }
}


// ARG_TYPE_STRING
function getStr(arg) {
  return arg.substr(1, arg.length - 2);
}


function isStr(arg) {
  return ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"')))
}


function isValidStr(arg) {
  if(!isStr(arg)) {
    console.log("Not a String");
    return false;
  }
  var strDelimiter = arg.charAt(0);
  if(getStr(arg).indexOf(strDelimiter) !== -1) {
    return false; 
  }
  return true;
}


function getStrArg(arg) {
  if(!isValidStr(arg)) {
    throw new Error("'" + arg + "' is an invalid string expression");
  }
  return getStr(arg);
}


// ARG_TYPE_ARRAY
function getArray(arg) {
  arg = strip(["[", "]"], arg.trim()).trim();
  if(arg === '') {
    // This has to be here, because ''.split(",") returns '['']', not '[]'...
    return [];
  }
  var vals = arg.split(",");
  var res = [];
  for(var i=0; i < vals.length; i++) {
    var val = vals[i].trim();
    res.push(getArg(val));
  }
  return res;
}


function isArray(arg) {
  return ((arg.startsWith("[") && arg.endsWith("]")));
}


function isValidArray(arg) {
  if(!isArray(arg)) {
    return false;
  }
  return true;
}


function getArrayArg(arg) {
  if(!isValidArray(arg)) {
    throw new Error("'" + arg + "' is an invalid array expression");
  }
  return getArray(arg);
}


// ARG_TYPE_STATE_ACCESS
function isStateAccess(arg) {
  var keys = arg.trim().split('.');
  if(keys.length < 2 || ARG_STATE_FIRST_LEVEL.indexOf(keys[0])=== -1) {
    return false
  }
  for(var i=1; i < keys.length; i++) {
    if(!isSlug(keys[i]) && isNaN(keys[i])) {
      return false;
    }
  }
  return true;
}


function getStateAccess(arg) {
  var keys = arg.trim().split('.');
  var firstLevel = keys[0];
  if(ARG_STATE_LEVEL_GLOBAL.indexOf(keys[0]) !== -1) {
    keys[0] = ARG_STATE_LEVEL_GLOBAL[0];
  }
  else if(ARG_STATE_LEVEL_RESOURCES.indexOf(keys[0]) !== -1) {
    keys[0] = ARG_STATE_LEVEL_RESOURCES[0];
  }
  else if(ARG_STATE_LEVEL_STORYLINES.indexOf(keys[0]) !== -1) {
    keys[0] = ARG_STATE_LEVEL_STORYLINES[0];
  }
  else if(ARG_STATE_LEVEL_CURRENT_STORYLINE.indexOf(keys[0]) !== -1) {
    keys[0] = "storylines";
    keys.splice(1, 0, "current_storyline");
  }
  else {
    throw new Error("First-Level must be one of " + ARG_STATE_FIRST_LEVEL);
  }
  return {"_type": "state", "data": keys}
}


function isValidSide(arg) {
  if(isInvalidStr(arg) || isInvalidArray(arg)) {
    return false;
  }
  return true;
}


function isValidLhs(arg) {
  return isValidSide(arg);
}


function isValidRhs(arg) {
  return isValidSide(arg);
}

function strip(stripList, string) {
  var beginIndex = 0, endIndex = string.length - 1;
  // needs polyfill for old browsers? 
  // https://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-an-object-in-javascript
  while(stripList.includes(string[beginIndex])) {
    beginIndex++;
  }
  while(stripList.includes(string[endIndex])) {
    endIndex--;
  }
  // substr doesn't take begin and end, it must be begin and len...
  return string.substr(beginIndex, endIndex - beginIndex + 1);
}


function getArg(arg) {
  switch(getArgType(arg)) {
    case ARG_TYPE_NULL:
      return null;
      break;
    case ARG_TYPE_BOOLEAN:
      return getBooleanArg(arg);
      break;
    case ARG_TYPE_NUMERAL:
      return null;
      break;
    case ARG_TYPE_STRING:
      return getStrArg(arg);
      break;
    case ARG_TYPE_ARRAY:
      return getArrayArg(arg);
      break;
    case ARG_TYPE_STATE_ACCESS:
      return getStateAccess(arg);
      break;
    default:
      throw new Error("Invalid expression '" + arg + "'");
  }
}


function getLhs(lhs) {
  if(getArgType(lhs) === ARG_TYPE_BOOLEAN) {
    throw new Error("Left-Hand Side cannot be boolean: '" + lhs + "'");
  }
  return getArg(lhs);
}


function getRhs(rhs) {
  return getArg(rhs);
}


module.exports.parseYmlCode = function parseYmlCode(codeString, shorthands) {
  // For now, at least, we suppose there is at least one whitespace before and after the operators
  var operator = findOperator(codeString);
  var lhs, rhs;
  [lhs, rhs] = codeString.split(operator);
  if(lhs.trim() == '') {
    throw new Error("Missing left-hand side");
  }
  if(rhs.trim() == '') {
    throw new Error("Missing right-hand side");
  }
  lhs = getLhs(lhs.trim());
  rhs = getRhs(rhs.trim());

  return {
    lhs: lhs,
    operator: operator,
    rhs: rhs
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

