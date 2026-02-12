---
title: Regular Expressions
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/regex.md
---

# Regular Expressions

Syntax: `/regex/flags` — `i` ignore case, `m` multiline. A regex evaluates to a **function** (matcher).

## In predicates

```jsonata
Account.Order.Product[`Product Name` ~> /hat/i]
```

`~>` chains: string is passed to the regex function; match → keep.

## Functions

- `$match(str, pattern)`, `$contains(str, pattern)`, `$split(str, pattern)`, `$replace(str, pattern, replacement)`

## Matcher as function

`/regex/` returns a function; call it with a string to get match details (match, start, end, groups) or empty sequence if no match.
