# "Storylines" specification

> This page specifies how to build a storyline from scratch, or update an existing one. They're not intended to be used as documentation, but more as an up-to-date resource of what can be achieved using the engine.

## Glossary
* **Story**, a self-contained narrative, organized in a number of *Storylines*. A *Story* has a title, a description and a list of *Resources* used in the story.
    - Example: "Starship adventures"
* **Storyline**, a potentially non-contiguous part of a *Story*, containing multiple *Events* linked together by their content and forming a complete narrative arc.
    - Example: "Alien onboard!"
* **Event**, a *Storyline* component contributing to the narrative arc for its *Storyline*. An *Event* is always only part of one and only one *Storyline*.
    - Example: "Noise in the cargo room"
* **Resource**, a name and a value that are visible to the user during the course of the Story, representing where he is in his current Story. *Resources* can be impacted by *Events*. *Resources* are defined within a *Story*, and can't change (their associated values, howevever, can).
    - Example: "Nuclear fuel: 250 units"
* **State**, a JSON mapping (where keys are strings and values can be strings, integers, float, arrays or JSON) completely defining where a reader currently is in his *Story* (and therefore, in his *Storylines*). A *State* always contains at least three keys: `global` for global variable useful to the 
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
    "Resource2": 
        description: "Resource description"
        format: "%s¥"
---

Description for your story
```

### `assets/` folder
This folder should contain all the required assets for your storyline---images, music, etc.

### `storylines/` folder
This folder will contain all the various storylines that make up your story.
