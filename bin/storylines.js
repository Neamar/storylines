#!/usr/bin/env node
'use strict';

const program = require('commander');

program
  .version(require('../package.json').version)
  .command('compile <story> [output]', 'compile the story and write to stdout or output')
  .command('chart <story> [raw] [dot]', 'chart all possible options and write to raw and dot (graphviz) files')
  .command('local <path>', 'run the given story in a local server')
  .parse(process.argv);
