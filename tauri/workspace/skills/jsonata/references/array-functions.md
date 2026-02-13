---
title: Array Functions
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/array-functions.md
---

# Array Functions

## $count(array)

Returns the number of items. Non-array is treated as singleton (returns 1). Context used if omitted.

```jsonata
$count([1,2,3,1])
$count("hello")
```

## $append(array1, array2)

Concatenates; non-arrays treated as singletons.

```jsonata
$append([1,2,3], [4,5,6])
$append([1,2,3], 4)
```

## $sort(array [, function])

Sorts array. Default: numbers or strings only, ascending. Optional comparator `function(left, right)` — return `true` to swap (place left after right). Stable sort.

```jsonata
$sort(Account.Order.Product, function($l, $r) { $l.Description.Weight > $r.Description.Weight })
```

## $reverse(array)

Reverses order.

```jsonata
$reverse(["Hello", "World"])
[1..5] ~> $reverse()
```

## $shuffle(array)

Random order.

## $distinct(array)

Removes duplicates (deep equality).

```jsonata
$distinct([1,2,3,3,4,3,5])
```

## $zip(array1, ...)

Zips arrays; length = shortest input. Variable arity.

```jsonata
$zip([1,2,3], [4,5,6])
$zip([1,2,3],[4,5],[7,8,9])
```
