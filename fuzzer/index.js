#!/usr/bin/env node
'use strict';

const fs = require("fs");
const Storyline = require('../frontend/storylines.js');

if(process.argv.length !== 3) {
  throw new Error('Invalid call. Usage: npm run fuzzer --  path/to/story');
}

const story = JSON.parse(fs.readFileSync(process.argv[2]).toString());


const callbacks = {
  displayEvent: function() {},
  displayResources: function() {},
};

const storyline = new Storyline(story, callbacks);


function walkTree(state) {

}
