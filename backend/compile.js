#!/usr/bin/env node
'use strict';

const bundle = require('./bundle.js');

module.exports = function compileStory(storyPath, outputPath) {
  const STORY_CONFIG_FILE = 'storyline.config.yml';
  const STORYLINES_FOLDER = 'storylines';

  if (storyPath[0] !== '/') {
    storyPath = process.cwd() + '/' + storyPath;
  }

  var b = bundle.storyBundle(storyPath, STORY_CONFIG_FILE, STORYLINES_FOLDER);

  if (!outputPath) {
    console.log(JSON.stringify(b));
  }
  else {
    require('fs').writeFileSync(outputPath, JSON.stringify(b, null, 2));
  }
};
