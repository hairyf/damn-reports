---
title: Building Result Structures
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/construction.md
---

# Construction

## Array constructors `[expr1, expr2, ...]`

Build arrays in the path. Keeps structure (no flattening).

```jsonata
Email.[address]
[Address, Other.`Alternative.Address`].City
```

## Object constructors `{ key: value, ... }`

- After **dot**: one object per context item.
- Without dot before `{`: one object, key/value pairs grouped (same key → values combined).

```jsonata
Phone.{ type: number }
Phone{ type: number }
Phone{ type: number[] }
```

Keys can be expressions (must evaluate to string). Values are expressions.

## JSON literals

Strings, numbers, `true`, `false`, `null`, objects `{}`, arrays `[]` use standard JSON syntax. JSONata is a **superset of JSON**: any valid JSON is valid JSONata; use as template and replace parts with expressions.
