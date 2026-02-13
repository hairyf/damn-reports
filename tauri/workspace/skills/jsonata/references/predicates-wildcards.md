---
title: Predicates and Wildcards
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/predicate.md
---

# Predicates and Wildcards

## Predicates `[expr]`

Filter at any path step. Expression evaluated in context item; boolean true → keep.

```jsonata
Phone[type='mobile']
Phone[type='office'].number
```

## Singleton vs array

Single value and single-element array are equivalent in expressions. Force array output with `[]` on a step:

```jsonata
Address[].City
Phone[][type='home'].number
```

## Wildcards

- `*`: all property values of current object.
- `**`: all descendants.

```jsonata
Address.*
*.Postcode
**.Postcode
```
