"use strict";
const Storylines = require('../../frontend/storylines.js');


describe("Storylines", () => {
  var stubDisplayEvent = () => {};
  var stubDisplayResources = () => {};
  var stubStory = {
    events: [],
    resources: {
      'r': {}
    },
    story_title: 'title',
    story_description: 'description'
  };
  var stubStoryline = new Storylines(stubStory, stubDisplayEvent, stubDisplayResources);

  describe("Conditions and operations", () => {
    describe("resolveStatePath()", () => {
      it("should return parent object and key when statePath exists", () => {

      });
    });
  });
});
