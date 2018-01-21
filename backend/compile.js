"use strict";

const bundle = require("./bundle.js");


if(process.argv.length !== 3) {
  throw new Error("Invalid call. Usage: node compile.js path/to/story");
}


const STORY_PATH = process.argv[2];
const STORY_CONFIG_FILE = '/storyline.config';
const STORYLINES_FOLDER = '/storylines';


var b = bundle(STORY_PATH, STORY_CONFIG_FILE, STORYLINES_FOLDER);
console.log(JSON.stringify(b));
