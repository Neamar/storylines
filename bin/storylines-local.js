'use strict';
const fs = require('fs');
const program = require('commander');
const nodemon = require('nodemon');
const frontend = require('./frontend');

const storyPath = '/tmp/storylines-story-wip.json';
const executablePath = `${__dirname}/storylines-compile.js`;
let currentStory = {};

// Compile the story on changes
function setupStorylineWatcher(story) {
  nodemon(`-e js,md ${executablePath} ${story} ${storyPath}`);
  nodemon.on('start', function() {
    console.log('App has started');
  }).on('quit', function() {
    console.log('App has quit');
    process.exit();
  }).on('restart', function(files) {
    console.log('App restarted due to: ', files);
  });
}


// Watch the story.json for change
function setupStoryWatcher() {
  let watcher = fs.watch(storyPath, function() {
    try {
      currentStory = JSON.parse(fs.readFileSync(storyPath).toString());
      console.log('Updated story.json');
    }
    catch (e) {
      console.log('Empty or invalid story.json');
    }

    // On some platforms, we watch for the inode, which doesn't change when the file is rewritten.
    // So we just reset up a new watcher on the inode
    watcher.close();
    process.nextTick(setupStoryWatcher);
  });
}

program
  .arguments('<story>')
  .action(function(story) {
    setupStoryWatcher();
    setupStorylineWatcher(story);
    frontend.get('/story.json', function(req, res) {
      console.log('Serving story');
      res.send(currentStory);
    });
  })
  .parse(process.argv);
