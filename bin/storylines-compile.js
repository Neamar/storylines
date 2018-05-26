'use strict';
const program = require('commander');

const compile = require('../backend/compile.js');

program
  .arguments('<cmd> [env]')
  .action(function(cmd, env) {
    compile(cmd, env);
  })
  .parse(process.argv);
