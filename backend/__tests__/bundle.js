"use strict";
const bundle = require('../bundle.js');

describe("storyBundle()", () => {
  test("should bundle a proper story", () => {
    var b = bundle.storyBundle(__dirname + "/mocks", "storyline.config.yml", "storylines");

    expect(b).toHaveProperty('version', 1);
    expect(b).toHaveProperty('story_title', 'Title for your story');
    expect(b).toHaveProperty('story_description', 'Potentially multiline, markdown description of your story');
    expect(b).toHaveProperty('events');
    expect(b).toHaveProperty('events.0.storyline', 'test_storyline_1');
    expect(b).toHaveProperty('events.0.event', 'event_1_1');
    expect(b).toHaveProperty('events.0.triggers.soft.conditions.0.lhs', {"_type": "state", "data": ['global', 'test']});
    expect(b).toHaveProperty('default_state.global', {"current_turn": 0});
    expect(b).toHaveProperty('default_state.resources', {resource1: 100, resource2: "ABC"});
    expect(b).toHaveProperty('default_state.storylines', {test_storyline_1: {}, test_storyline_2: {}});
  });
});
