# "Storylines" frontend specification
This page explains how the frontend displays a *Storyline* to a *Reader*.

> This page will assume you've read the [backend specification](backend.md), and have a valid *Story Bundle* to use.

## Initialisation
When a user wishes to start a *Story*, a copy of the *Story Bundle* `default_state` is made, and will be used as this *Character* *State*.

All the resources defined within the config are displayed somewhere visible at all time by the *Reader*, and their values are taken from the *State*.

The *Story* can now begin, it's Story time.

## Story time
### Picking an event
The engine iterates over all the *Events*, and builds two lists:

* The first list contains all *Events* with matching `hard` triggers;
* The second list contains all *Events* with matching `soft` triggers;

The following logic then applies:

* If the first list is not empty,
    - Pick the first event within the list, set it as *Current Event*, and move on to "Resolving an event".
* Otherwise,
    - Sum all the `weight` of matching events in the Soft list
    - Randomly pick a number between 0 and the sum calculated above
    - Find the associated event (weighted lottery), set it as *Current Event*, and move on to "Resolving an event"
* If both lists are empty, and `global.no_events_available` is falsy, set `global.no_events_available` to `true`, and regenerate the matching lists
* If both lists are empty, and `global.no_events_available` is `true`, the engine throws an error "No Events available."

### Displaying an event
The *Current Event* description is displayed to the *Reader*.

For every available action, a button or similar UI component is displayed allowing the *Reader* to make a choice for his character.

If no actions are available, see "Special case: actionless events".

### Resolving an event
Upon clicking an action, the selected action operations are applied, updating the user *State*.

The engine then push into the *State* `history` key an array containing the event slug and the action taken. Note that this key is not available from the *Events*.
The engine also increments `global.current_turn` by 1.

The UI for *Resources* is updated.

The engine then moves back to "Picking an event".

### Special case: actionless events
Some events don't have any actions.

Those are "final" events, ending the story.
