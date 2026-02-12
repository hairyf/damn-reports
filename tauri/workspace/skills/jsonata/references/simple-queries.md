---
title: Simple Queries and Navigation
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/simple.md
---

# Simple Queries

Location path syntax selects values from JSON. Use **dot** for object fields and **brackets** for array indices.

## Objects

- `field` → value of that field.
- `obj.nested.field` → navigate with `.`; missing path returns nothing (undefined), no error.
- `` obj.`Over 18 ?` `` → backticks for names with spaces or reserved tokens.

```jsonata
Address.City
```
→ `"Winchester"`

## Arrays

- `arr[0]` first, `arr[-1]` last; negative index from end.
- `arr` (no brackets) = whole array; then `.field` on each element.
- `Phone.number` → all `number` from each item in `Phone` (array of values).
- `(Phone.number)[0]` → first number only (parentheses override precedence).
- `Phone[[0..1]]` → range of items (first two).

## Top-level array

When the root is an array, use `$` for the document:

```jsonata
$[0]
$.ref
```
`$` = entire input; `$[0].ref` selects from first element.

## Sequence flattening

Nested arrays from path selection are flattened in the result sequence; use [array constructors](construction.md) to preserve structure.
