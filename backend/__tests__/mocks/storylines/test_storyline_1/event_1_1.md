---
triggers:
    soft:
        conditions:
            - g.test == true
        weight: 1
actions:
    "OK":
        operations:
            - g.test = false
---

Potentially multiline, markdown description of your event