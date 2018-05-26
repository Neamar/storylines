'use strict';
const program = require('commander');

const fuzzer = require('../fuzzer/index.js');

program
  .arguments('<story> [raw] [dot]')
  .action(function(story, raw, dot) {
    fuzzer(story, raw, dot);
  })
  .parse(process.argv);
