# "Storylines" specification

> This page specifies how to build a storyline from scratch, or update an existing one. You should not use them as documentation, but more as an up-to-date resource of what can be achieved using the engine.

## Glossary
* **Reader**, a user somewhere reading and interatcing with the story
* **Story**, a self-contained narrative, organized in multiple *Storylines*. A *Story* has a title, a description and a list of *Resources* used in the story.
    - Example: "Starship adventures"
* **Storyline**, a potentially non-contiguous part of a *Story*, containing multiple *Events* linked together by their content and forming a complete narrative arc.
    - Example: "Alien onboard!"
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

## Components
A storyline is composed of three different resources:

* A `storyline.config` file;
* An `assets` folder, which can be empty;
* A `storylines` folder, which can be empty

### `storyline.config`
This file is a [Front-Matter](https://jekyllrb.com/docs/frontmatter/) YML file.

A valid file must contain the following keys:

```yml
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

Description of your story
```

In the rest of this document, the term "config" means the values defined in this file.

* **version**: integer, constant, must always be 1.
* **story_title**, string, your story name
* **resources**, object, a list of all your resources. Keys will be used when generating the state, the value define:
    - **description**, string, more information about what this resource is about
    - **format**, string, a placeholder with a `%s` token in it. This will be used every time the value is presented to the *Reader*, to format the resource appropriately. A *format* without a `%s` is invalid.
    - **display_name**, string, the name used when displaying the resource to the user
    - **default**, (integer|string|float|array), the default value when starting a new `Story`

### `assets/` folder
This folder should contain all the required assets for your storyline---images, music, etc.

### `storylines/` folder
This folder will contain all the various *Storylines* that make up your story.

### Initialisation
When a new *Reader* joins the story, his *State* is initialised to the following JSON:

```json
{
    "global": {},
    "resources": {
        "Resource1": 100,
        "Resource2": "ABC"
    },
    "storylines": {}
}
```

* An empty `global` key
* An empty `storylines` key
* A `resources` object, containing, for each resource defined in `storyline.config`:
    - Resource name as a key
    - Resource value as defined by their `default` in the config.
