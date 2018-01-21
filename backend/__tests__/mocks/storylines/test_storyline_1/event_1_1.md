---
triggers:
    soft:
        conditions:
            - g.test == true
actions:
    "OK":
        operations:
            - g.test = false
---

Potentially multiline, markdown description of your event
