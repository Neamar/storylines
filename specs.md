# "Storylines" specification

> This page specifies how to build a storyline from scratch, or update an existing one. You should not use them as documentation, but more as an up-to-date resource of what can be achieved using the engine.

## Glossary
* **Reader**, a user somewhere reading and interatcing with the story
* **Story writer**, a user writing the story for consumption by *Readers*.
* **Story**, a self-contained narrative, organized in multiple *Storylines*. A *Story* has a title, a description and a list of *Resources* used in the story.
    - Example: "Starship adventures"
* **Storyline**, a potentially non-contiguous part of a *Story*, containing multiple *Events* linked together by their content and forming a complete narrative arc.
    - Example: "alien_onboard"
* **Event**, a *Storyline* component contributing to the narrative arc for its *Storyline*. An *Event* is always only part of one and only one *Storyline*.
    - Example: "Noise in the cargo room"
* **Resource**, a name and value visible to the user during the Story, representing where he is in his current Story. *Resources* can be impacted by *Events*. *Resources* are defined within a *Story*, and can't change (their associated values, however, can).
    - Example: "Nuclear fuel: 250 units"
* **State**, a JSON mapping (where keys are strings and values can be strings, integers, float, arrays or JSON) completely defining where a *Reader* currently is in his *Story* (and therefore, in his *Storylines*). A *State* always contains at least three keys: `global` for global variable useful to the 
*Story*, `resources` with the resource defined by the *Story*, and `storylines` with all data relative to past *Storylines*.
    - Example: `{"global": {}, "resources": {"Nuclear fuel": 250}, storylines: {}}`
* **Conditions**, an array of boolean conditionals linked together with the "AND" operator. The conditions are applied on a *State* and can reference *State* elements or constant values. *Conditions* can be expressed in JSON or YML.
    - Example: `"Nuclear fuel" > 500`
* **Operations**, an array of operations updating a given *State* by applying various transformations to it. *Operations* can be expressed in JSON or YML.
    - Example: `"Nuclear fuel" = 650`
* **Story bundle**, a single JSON file containing all the story. This file isn't intended to be read by humans, it is instead generated automatically from the various *Story* components.

## Components
A storyline is composed of three different resources:

* A `storyline.config` file;
* An `assets` folder, which can be empty;
* A `storylines` folder, which can be empty

### `storyline.config`
This file is a [Front-Matter](https://jekyllrb.com/docs/frontmatter/) YML file.

A valid file **must** contain the following keys:

```yaml
---
version: 1
story_title: "Title for your story"
resources:
    "Resource1":
        description: "Resource description"
        format: "%s"
        display_name: "Resource 1"
        default: 100
    "Resource2": 
        description: "Resource description"
        format: "%s¥"
        display_name: "Resource 2"
        default: "ABC"
---

Potentially multiline, markdown description of your story
```

In this document, the term "config" means the values defined in this file.

* `version` integer, constant, **must** always be 1.
* `story_title`, string, your story name
* `resources`, object, a list of all your resources. Keys will be used when generating the state, the value define:
    - `description`, string, more information about what this resource is about
    - `format`, string, a placeholder with a `%s` token in it. This will be used every time the value is presented to the *Reader*, to format the resource appropriately. A *format* without a `%s` is invalid.
    - `display_name`, string, the name used when displaying the resource to the user
    - `default`, (integer|string|float|array), the default value when starting a new `Story`

### `assets/` folder
This folder should contain all the required assets for your storyline---images, music, etc.

### `storylines/` folder
This folder will contain all the various *Storylines* that make up your story.

## Initialisation
When a new *Reader* joins the story, his *State* is initialised to the following JSON:

```json
{
    "global": {},
    "resources": {
        "Resource1": 100,
        "Resource2": "ABC"
    },
    "storylines": {
        "Storyline1": {}
    }
}
```

* An empty `global` key
* A `resources` object, containing for each resource defined in `storyline.config`:
    - Resource name as a key
    - Resource value as defined by their `default` in the config.
* A `storylines` key, containing an empty object for each *Storyline* defined in *storylines/*

## Compilation
Any valid *Story* can be compiled into a *Story bundle*.
TBD.

## Storylines and Events
### Storylines
Within the *storylines/* folder, the *Story writer* will put all his *Storylines* and *Events*.

Every *Storyline* is a folder within the *storylines/* main folder.
A storyline name **must** be slugified (no special characters, must start with an alpha character, all lower cased, spaces replaced by the `_` symbol).

### Events
In a *Storyline* folder (`/storylines/{storyline-slug}/`, the *Story writer* will create as many *Events* files as he wants.

The event file name **must** be a proper slug (no special characters, must start with an alpha character, all lower cased, spaces replaced by the `_` symbol).

An event file **must** contain the following keys:

```yaml
---
triggers:
    hard:
        conditions:
            - [[CONDITION]]
    soft:
        conditions:
            - [[CONDITION]]
actions:
    "Action name 1":
        operations:
            - [[OPERATION]]
    "Action name 2":
        operations:
            - [[OPERATION]]
---

Potentially multiline, markdown description of your event
```

Here are the possible keys:
* `triggers`, an object which **must** contain at least one `soft` of `hard` subkey, or can contain both.
    - `hard`, an object. The only available key within this object is:
        + `conditions`, an array of conditions. If multiple conditions are present, they are **AND**ed together. See "Conditions & operations" below for details.
    - `soft`, an object. Available keys are:
        + `conditions`, an array of conditions. If multiple conditions are present, they are **AND**ed together. See "Conditions & operations" below for details.
        + `weight`, an integer, defaults to 1. Any value higher than 1 will mean this event has more probability to appear to the user (10 means this event counts for 10 in the lottery)
* `actions`, an object of available actions for the *Reader*. The only time when this object can be empty is for end events, to finish the story. Each action key is the name that will be displayed. Within this key:
    - `operations`, a list of operations that will be applied if this action is chosen. See "Conditions & operations" below for details.

## Conditions and operations
### Conditions
*Conditions* are a way to express a conditional test on the current `State`.

A *Condition* is formed of three components in this order: `lhs` (left hand side), `operator`, `rhs` (right hand side).

> Example *Conditions*:
> 
> * `storylines.alien_onboard.started == true`
> * `storylines.alien_onboard.has_destroyed_starship == false`
> * `sl.has_destroyed_starship == false`
> * `resources.crew >= 150`
> * `g.alarm_level <= 2`
> * `"First Lieutenant" in global.officers`

#### `lhs`, `rhs` in *Conditions*
Both `lhs` and `rhs` must be either a constant value (strings must be enclosed in quotes) or a dotted value from `State`:

* Any value mapping to an existing state item will be replaced with this value
* Any missing value in the dotted chain after the first `.` will interrupt the parsing and return null (`storylines.nonexisting.something` will return `null`, so will `storylines.nonexisting`).
* First level value can use a single-letter notation, mapping to the name of the extended key. Valid values are `g` for `global`, `r` for `resources` and `s` for `storylines`. Those shorthand values will be replaced at compile time.
* First level value can use the shorthand `sl` to access the current storyline (will be replaced by `storylines.{slug}` at compile time)
* Accessing a non-existing first level component (anything different than `global`, `resources`, `storylines`, `g`, `r`, `s` or `sl`) will throw an error when compiling the *Story*

#### `operator` in *Conditions*
`operator` must be one of the following value:

* `==`, the equal operator. Using a single `=` sign will throw an error when compiling the `Story`.
* `>`, greater than
* `<`, less than
* `>=`, greater than or equal to
* `<=`, less than or equal to
* `!=`, different
* `in`, contains.
    - For objects, will test if the `lhs` key exists within `rhs`
    - For arrays, will test if `lhs` is included in `rhs`

### Operations
*Operations* are a way to change the current `State`.

An *Operation* is formed of three components in this order: `lhs`, `operator`, `rhs`.

> Example *Operations*:
> 
> * `storylines.alien_onboard.started = true`
> * `resources.crew -= 20`
> * `global.alarm_level += 1`
> * `"First Lieutenant" APPEND TO global.officers`

#### `lhs` in *Operations*
`lhs` must be a dotted value from `State`.

* Accessing a value in a non-existing path (e.g. `storylines.nonexisting.something`) will throw a Runtime error.
* Accessing a non-existing variable (`storylines.existing.nonexisting`) will create this value and assign it for the first time. The `=` operator is the only valid one in this situation, otherwise a Runtime exception is thrown.
* First level values can use a single-letter notation, mapping to the name of the extended key. Valid values are `g` for `global`, `r` for `resources` and `s` for `storylines`.
* First level value can use the shorthand `sl` to access the current storyline (will be replaced by `storylines.{slug}` at compile time)
* Accessing a non-existing first level component (anything different than `global`, `resources`, `storylines`, `g`, `r`, `s` or `sl`) will throw an error when compiling the *Story*


#### `rhs` in *Operations*
`rhs` must be either a constant value (strings must be enclosed in quotes) or a dotted value from `State`:

* Any value mapping to an existing state item will be replaced with this value
* Any missing value in the dotted chain after the first `.` will interrupt the parsing and return null (`storylines.nonexisting.something` will return `null`, so will `storylines.nonexisting`).
* First level values can use a single-letter notation, mapping to the name of the extended key. Valid values are `g` for `global`, `r` for `resources` and `s` for `storylines`.
* First level value can use the shorthand `sl` to access the current storyline (will be replaced by `storylines.{slug}` at compile time)
* Accessing a non-existing first level component (anything different than `global`, `resources`, `storylines`, `g`, `r`, `s` or `sl`) will throw an error when compiling the *Story*

#### `operator` in *Operations*
`operator` must be one of the following value:

* `=`, direct assignment, set `lhs` to `rhs`. Can be used to initialize a dotted path in the *State*.
* `+=`, add `rhs` to `lhs`
    - If `lhs` is a scalar, use mathematical addition
    - If `lhs` is a string, use concatenation
    - If `lhs` is anything else, will throw a Runtime exception
* `-=`, subtract `rhs` to `lhs`
    - If `lhs` is a scalar, use mathematical addition
    - If `lhs` is a string, use concatenation
    - If `lhs` is anything else, will throw a Runtime exception
* `*=`, multiply `lhs` by `rhs`. Only valid for scalars, will throw a Runtime exception otherwise.
* `/=`, divide `lhs` by `rhs`. Only valid for scalars, will throw a Runtime exception otherwise.
* `APPEND TO`, append `rhs` to the `lhs` list. Only valid for arrays, will throw a Runtime exception otherwise
* `REMOVE FROM`, remove `rhs` from `lhs` if present in the list. Only remove once, do nothing if `rhs` is not in `lhs`. Only valid for arrays, will throw a Runtime exception otherwise

## Story bundle
A *Story bundle* is generated automatically from the story config and storylines.

It is one big JSON containing all the data properly formatted.

All the keys from the config are first-level keys in the *Story bundle* (`version`, `story_title`, ...). The config FrontMatter content is stored under `story_description`.

In addition, a key named `storylines` holds an array of all the storylines. Similarly to the config, every event YML file is converted to JSON (with shorthand modifiers replaced), with an additional `storyline` key containing the current storyline slug, and `event` key containing the current event slug; The event FrontMatter content is stored under `description`.
