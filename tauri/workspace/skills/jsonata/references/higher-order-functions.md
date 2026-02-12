---
title: Higher-Order Functions
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/higher-order-functions.md
---

# Higher-Order Functions

## $map(array, function)

Apply function to each element. Signature: `function(value [, index [, array]])`.

```jsonata
$map([1,2,3], function($v) { $v * 2 })
$map([1..5], $string)
```

## $filter(array, function)

Keep elements where function returns true.

```jsonata
$filter(Account.Order.Product, function($v, $i, $a) {
  $v.Price > $average($a.Price)
})
```

## $single(array, function)

Exactly one match; else throws.

```jsonata
$single(Account.Order.Product, function($v) { $v.SKU = "0406654608" })
```

## $reduce(array, function [, init])

Fold: `function(accumulator, value [, index [, array]])`. Optional `init`; else first element.

```jsonata
$reduce([1..5], function($i, $j){ $i * $j })
```

## $sift(object, function)

Keep key/value pairs where predicate is true. Signature: `function(value [, key [, object]])`.

```jsonata
Account.Order.Product.$sift(function($v, $k) { $k ~> /^Product/ })
```
