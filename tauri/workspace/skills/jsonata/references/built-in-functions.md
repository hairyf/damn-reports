---
title: Built-in Function Overview
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs
---

# Built-in Functions (Summary)

Full reference: [docs.jsonata.org](http://docs.jsonata.org/).

## String

- `$string(arg)`, `$length(str)`, `$substring(str, start[, length])`
- `$substringBefore(str, chars)`, `$substringAfter(str, chars)`
- `$uppercase(str)`, `$lowercase(str)`, `$trim(str)`
- `$pad(str, width[, char])`, `$contains(str, pattern)`, `$split(str, separator)`
- `$join(array[, sep])`

Many accept context as first arg when omitted (e.g. `OrderID.$length()`).

## Numeric / aggregation

- `$sum(array)`, `$max(array)`, `$min(array)`, `$average(array)`
- `$count(array)`, `$number(arg)`

## Array

- `$append(array1, array2)`, `$sort(array[, comparator])`
- `$reverse(array)`, `$distinct(array)`
- Higher-order: `$map`, `$filter`, `$reduce`, `$single` (see [higher-order-functions](higher-order-functions.md))

## Object

- `$keys(object)`, `$lookup(object, key)`, `$sift(object, function)`
- `$merge(array of objects)`, `$spread(object)`

## Other

- `$exists(expr)`, `$assert(expr, message)`, `$not(expr)`, `$boolean(arg)`
- `$type(value)`, regex: `$match(str, pattern)`, `$eval(expr)`
- Date/time: `$fromMillis`, `$toMillis`, `$now`, etc.

Signatures use type symbols (e.g. `<a:n>`, `<s-:n>`) for validation when registering or calling.
