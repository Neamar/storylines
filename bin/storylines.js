'use strict';

const program = require('commander');

program
  .version(require('../package.json').version)
  .command('compile <story> [output]', 'compile the story and write to stdout or output')
  .command('graph <story> [raw] [dot]', 'graph all possible options and write to raw and dot (graphviz) files')
  .parse(process.argv);