#!/usr/bin/env node
"use strict";

const bundle = require("./bundle.js");

if(process.argv.length !== 3 && process.argv.length !== 4) {
  throw new Error("Invalid call. Usage: storyline path/to/story [outputfile]");
}


const STORY_PATH = process.argv[2];
const STORY_CONFIG_FILE = 'storyline.config.yml';
const STORYLINES_FOLDER = 'storylines';


var b = bundle.storyBundle(STORY_PATH, STORY_CONFIG_FILE, STORYLINES_FOLDER);

if(!process.argv[3]) {
  console.log(JSON.stringify(b));
}
else {
  require('fs').writeFileSync(process.argv[3], JSON.stringify(b, null, 2))
}
