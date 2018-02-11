---
triggers:
    soft:
        conditions:
            OR:
                - g.test == true
                - AND:
                    - g.test1 <= 1
                    - g.test2 == true
        weight: 1
actions:
    "OK":
        operations:
            - g.test = false
---

Potentially multiline, markdown description of your event
