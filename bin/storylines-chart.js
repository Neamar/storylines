'use strict';
const program = require('commander');

const fuzzer = require('../chart/index.js');

program
  .arguments('<story> [raw] [dot]')
  .option('-v, --verbose', 'Verbose output')
  .action(function(story, raw, dot) {
    fuzzer(story, raw, dot, program.verbose);
  })
  .parse(process.argv);
