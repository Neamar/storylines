class Storylines {
  constructor(story, displayEvent, displayResources) {
    this.story = story;
    this.events = story.events;
    this.resources = story.resources;
    this.title = story.story_title;
    this.description = story.story_description;

    // Clone default state
    this.state = Object.assign({}, story.default_state);

    // Save functions to interact with UI
    this.displayEvent = displayEvent;
    this.displayResources = displayResources;

    // Start game
    this.updateResourcesUI();
  }

  start() {
    if(this.currentEvent) {
      throw new Error("Storyline already started!");
    }

    this.nextEvent();
  }

  updateResourcesUI() {
    this.displayResources(this.resources, this.state.resources);
  }

  /**
  * Return all events currently matching the Reader's state
  * on triggerType ("soft" or "hard") only.
  */
  listAvailableEvents(triggerType) {
    return this.events.filter(e => {
      // Discard if event doesn't have any triggers of this type
      if(!e.triggers[triggerType]) {
        return false;
      }

      // Otherwise, return true if all conditions pass
      return this.testConditions(e.triggers[triggerType]);
    });
  }

  listAvailableHardEvents() {
    return this.listAvailableEvents("hard");
  }

  listAvailableSoftEvents() {
    return this.listAvailableEvents("soft");
  }

  /**
   * Displays the next event.
   * If there is at least one hard trigger matching, use it.
   * Otherwise pick one of the soft events
   * If still empty, set a value on the state informing no events are currently available.
   */
  nextEvent() {
    let hardEvents = this.listAvailableHardEvents();
    if(hardEvents.length > 0) {
      this.moveToEvent(hardEvents[0]);
      return;
    }

    let softEvents = this.listAvailableSoftEvents();
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

  /**
   * Switch the display to the specified event
   */
  moveToEvent(event) {
    this.currentEvent = event;
    this.displayEvent(event, this.respondToEvent.bind(this));
  }

  /**
   * Pick an action on the current event
   */
  respondToEvent(action) {
    if(!(action in this.currentEvent.actions)) {
      throw new Error(`Action ${action} is not available in event ${this.currentEvent.event}`);
    }

    let operations = this.currentEvent.actions[action].operations;
    this.applyOperations(operations);
  }

  /**
  * Return true if all the specified conditions pass
  * (logical AND)
  */
  testConditions(conditions) {
    return conditions.every(c => this.testCondition(c));
  }

  /**
  * Test the specified condition, which can use the state,
  * and returns a boolean.
  */
  testCondition(condition) {
    let lhs = this.resolveValue(condition.lhs);
    let rhs = this.resolveValue(condition.rhs);

    switch(condition.operator) {
      case '==':
        return lhs === rhs;
      case '>':
        return lhs > rhs;
      case '>=':
        return lhs >= rhs;
      case '<':
        return lhs < rhs;
      case '<=':
        return lhs <= rhs;
      case '!=':
        return lhs !== rhs;
      default:
        throw new Error("Invalid operator " + condition.operator);
    }
  }

  applyOperations(operations) {
    operations.forEach(o => this.applyOperation(o));
  }

  /**
   * Apply an operation to update the Reader's state
   */
  applyOperation(operation) {
    let lhs = this.resolveStatePath(operation.lhs, true);

    if(lhs.missingOnLastLevel && operation.operator !== '=') {
      throw new Error("Can't apply compound operator on undefined");
    }

    let rhs = this.resolveValue(operation.rhs);

    switch(operation.operator) {
      case '=':
        lhs.parent[lhs.key] = rhs;
        break;
      case '+=':
        lhs.parent[lhs.key] += rhs;
        break;
      case '-=':
        lhs.parent[lhs.key] -= rhs;
        break;
      case '*=':
        lhs.parent[lhs.key] *= rhs;
        break;
      case '/=':
        lhs.parent[lhs.key] /= rhs;
        break;
      case '%=':
        lhs.parent[lhs.key] %= rhs;
        break;
      default:
        throw new Error("Invalid operator " + operation.operator);
    }
  }

  /**
   * Return true if the specified value contains an access to the current state (and false for constant values)
   */
  isStateAccess(value) {
    if(!value._type || value._type !== 'state') {
      return false;
    }

    return true;
  }

  /*
   * Resolve any value (potentially a dotted state access) to its primitive value.
   * "ABC" => ABC
   * {_type: "state", data:["global", "something"]} == this.state.global.something
   */
  resolveValue(value) {
    if(!this.isStateAccess(value)) {
      return value;
    }

    let r = this.resolveStatePath(value, false);
    return r.parent[r.key];
  }

  /**
   * Given a path within the state, find the associated value
   * By default, return null for missing value,
   * unless `throwOnMissing` is defined
   */
  resolveStatePath(statePath, throwOnMissing) {
    if(!this.isStateAccess(statePath)) {
      throw new Error("Must be a state access! " + statePath.join("."));
    }

    // Clone the array, as we're going to destroy it
    let shiftableStatePath = statePath.data.slice(0);
    let value = this.state;
    while(true) {
      var path = shiftableStatePath.shift();
      if(!(path in value)) {
        if(throwOnMissing) {
          throw new Error("Trying to access non-existing path in state: " + statePath.data.join("."));
        }
        return {
          parent: value,
          key: path,
          missing: true,
          missingOnLastLevel: false
        };
      }

      value = value[path];

      if(shiftableStatePath.length === 1) {
        var exists = (shiftableStatePath[0] in value);
        return {
          parent: value,
          key: shiftableStatePath[0],
          missing: !exists,
          missingOnLastLevel: !exists
        };
      }
    }
  }
}

// Allow for easy testing in the backend
try {
  module.exports = Storylines;
} catch(e) {}
