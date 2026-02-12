---
title: Boolean Functions and Operators
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/boolean-functions.md, boolean-operators.md
---

# Boolean Functions and Operators

## $boolean(arg)

Casts to boolean: empty string/array/object → false; non-empty → true; number 0 → false; null → false; function → false. Arrays: true if any member casts to true.

## $not(arg)

Logical NOT; arg cast to boolean first.

## $exists(arg)

Returns true if expression evaluates to a value; false for non-match (e.g. missing path).

```jsonata
$exists(foo.bar)
```

## Operators

- **and** — both operands cast to boolean; true only if both true.
- **or** — true if either true.
- **NOT** is only as function: `$not(expr)`, not an operator.

```jsonata
library.books["Aho" in authors and price < 50].title
library.books[price < 10 or section="diy"].title
```
