'use strict';
const fs = require('fs');
const program = require('commander');
const nodemon = require('nodemon');


const compiledStoryPath = '/tmp/storylines-story-wip.json';
const executablePath = `${__dirname}/storylines-compile.js`;
let currentStory = {};

// Compile the story on changes
function setupStorylineWatcher(story) {
  nodemon(`-e js,md ${executablePath} ${story} ${compiledStoryPath}`);
  nodemon.on('start', function() {
    console.log('App has started');
  }).on('quit', function() {
    console.log('App has quit');
    process.exit();
  }).on('restart', function(files) {
    console.log('App restarted due to: ', files);
  });
}


let emptyOrInvalidTimeout;
// Watch the story.json for change
function setupStoryWatcher() {
  let watcher = fs.watch(compiledStoryPath, function() {
    try {
      var jsonContent = fs.readFileSync(compiledStoryPath).toString();
      currentStory = JSON.parse(jsonContent);

      // If we were successful, discard previous message if it wasn't displayed yet
      // (the process always truncates the file first, so without this protection we'd display "Empty json" on every change)
      clearTimeout(emptyOrInvalidTimeout);
      console.log('Updated story.json');
    }
    catch (e) {
      emptyOrInvalidTimeout = setTimeout(() => console.log('Empty or invalid story.json'), 500);
    }

    // On some platforms, we watch for the inode, which doesn't change when the file is rewritten.
    // So we just reset up a new watcher on the inode
    watcher.close();
    process.nextTick(setupStoryWatcher);
  });
}


function runServer() {
  const express = require('express');
  const app = express();

  app.get('/story.json', function(req, res) {
    console.log('Serving story');
    res.send(currentStory);
  });
  app.use(express.static(__dirname + '/../frontend'));

  app.listen(3000, () => console.log('Frontend app listening on port 3000!\nhttp://localhost:3000/'));

}

program
  .arguments('<story>')
  .action(function(story) {
    fs.writeFileSync(compiledStoryPath, '{}');
    setupStoryWatcher();
    setupStorylineWatcher(story);
    runServer();
  })
  .parse(process.argv);
