class Storylines {
  constructor(story, displayEvent) {
    this.story = story;
    this.events = story.events;
    this.resources = story.resources;
    this.title = story.story_title;
    this.description = story.story_description;

    // Clone default state
    this.state = Object.assign({}, story.default_state);

    // Save functions to interact with UI
    this.displayEvent = displayEvent;

    // Start game
    this.nextEvent();
  }

  listAvailableEvents(triggerType) {
    return this.events;
  }

  listAvailableHardEvents() {
    return this.listAvailableEvents("hard");
  }

  listAvailableSoftEvents() {
    return this.listAvailableEvents("soft");
  }

  nextEvent() {
    var hardEvents = this.listAvailableHardEvents();
    if(hardEvents.length > 0) {
      this.moveToEvent(hardEvents[0]);
      return;
    }

    var softEvents = this.listAvailableSoftEvents();
    if(softEvents.length > 0) {
      return;
    }

    if(!this.state.global.no_events_available) {
      this.state.global.no_events_available = true;
      this.nextEvent();
      return;
    }

    throw new Error("No more events available, no listeners on no_events_available.");
  }

  moveToEvent(event) {
    this.displayEvent(event);
  }
}
