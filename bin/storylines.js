'use strict';
const compile = require('../backend/compile.js');

let command = process.argv[2];

if (!command) {
  throw new Error('Command is missing');
}

if (command === 'compile') {
  if (process.argv.length !== 4 && process.argv.length !== 5) {
    throw new Error('Invalid call. Usage: storylines compile path/to/story [outputfile]');
  }

  compile(process.argv[3], process.argv[4]);
}
