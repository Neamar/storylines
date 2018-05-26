'use strict';
const program = require('commander');

const compile = require('../backend/compile.js');

program
  .arguments('<story> [output]')
  .action(function(story, output) {
    compile(story, output);
  })
  .parse(process.argv);
