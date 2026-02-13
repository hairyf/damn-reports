---
title: Comparison Operators
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/comparison-operators.md
---

# Comparison Operators

Return boolean. Numeric comparison for `<`, `<=`, `>`, `>=`. Equality is deep for arrays/objects (same order for arrays; key/value for objects, order irrelevant).

## = (Equals), != (Not equals)

Type and value must match. Arrays: same values in same order. Objects: same key/value pairs.

```jsonata
1+1 = 2
"Hello" != "World"
```

## <, <=, >, >=

Numeric comparison.

## in (Inclusion)

LHS value in RHS array (or sequence). RHS single value treated as singleton array.

```jsonata
"world" in ["hello", "world"]
"hello" in "hello"
library.books["Aho" in authors].title
```
