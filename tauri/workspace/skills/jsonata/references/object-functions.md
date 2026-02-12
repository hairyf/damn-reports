---
title: Object and Utility Functions
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/object-functions.md
---

# Object and Utility Functions

## $keys(object)

Array of keys. If argument is array of objects, returns de-duplicated keys from all.

## $lookup(object, key)

Value for key in object. If first arg is array of objects, returns all values for that key from each.

## $spread(object)

Object → array of single key/value objects. Array of objects → flattened array of single pairs.

## $merge(array<object>)

Merges array of objects into one; same key → last wins. Input must be array of objects.

## $sift(object, function)

Keeps key/value pairs where predicate is true. Signature: `function(value [, key [, object]])`. See [higher-order-functions](higher-order-functions.md).

## $each(object, function)

Returns array of results of function applied to each key/value. Signature: `function(value, name)`.

```jsonata
$each(Address, function($v, $k) { $k & ": " & $v })
```

## $type(value)

Returns type string: `"null"`, `"number"`, `"string"`, `"boolean"`, `"array"`, `"object"`, `"function"`. Returns undefined for undefined.

## $error(message), $assert(condition, message)

$error throws with optional message. $assert: condition true → undefined; false → throw with message.
