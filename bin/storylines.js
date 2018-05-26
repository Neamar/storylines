'use strict';

const program = require('commander');

program
  .version(require('../package.json').version)
  .command('compile <story> [output]', 'compile the story and writes it to stdout or output')
  .command('list', 'list packages installed', {isDefault: true})
  .parse(process.argv);
