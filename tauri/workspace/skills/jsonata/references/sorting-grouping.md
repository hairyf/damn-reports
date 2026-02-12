---
title: Sorting, Grouping, Aggregation
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/sorting-grouping.md
---

# Sorting, Grouping and Aggregation

## Sorting

- **Order-by in path**: `path^(expr)` or `path^(>expr)` for descending; comma for secondary: `^(>Price, <Quantity)`.
- **Function**: `$sort(array)` or `$sort(array, function)` for custom comparator.

## Grouping

Use object constructor **without** a dot before `{`: key expression groups by value; same key → values aggregated.

```jsonata
Account.Order.Product{ `Product Name`: Price }
Account.Order.Product{ `Product Name`: $.(Price*Quantity) }
Account.Order.Product{ `Product Name`: $sum($.(Price*Quantity)) }
```

Per-group object per item: use `$.{ ... }` in the value.

```jsonata
Account.Order.Product{ `Product Name`: $.{"Price": Price, "Qty": Quantity} }
```

## Aggregation

Apply to array to get one value: `$sum`, `$average`, `$min`, `$max`, etc.

```jsonata
$sum(Account.Order.Product.Price)
$sum(Account.Order.Product.(Price*Quantity))
```

Use `$reduce()` for custom aggregators.
