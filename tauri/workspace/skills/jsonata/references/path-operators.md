---
title: Path Operators (Map, Filter, Sort, Reduce)
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/path-operators.md
---

# Path Operators

Path stages implement map/filter/reduce semantics.

## `.` (Map)

LHS → array of values; RHS evaluated for each (context = `$`). Results combined (flattened).

```jsonata
Address.City
Phone.number
Account.Order.Product.(Price * Quantity)
```

## `[expr]` (Filter)

- Integer (or expression → number): select that index (0-based).
- Array of integers: select those indices.
- Otherwise: cast to boolean; keep item if true.

```jsonata
Phone[type='mobile'].number
```

## `^(expr)` (Order-by)

Sort by expression. Default ascending; `>` for descending. Comma for secondary sort.

```jsonata
Account.Order.Product^(Price)
Account.Order.Product^(>Price, <Quantity)
```

## `{ key: value, ... }` (Reduce)

Final step: group and aggregate input into one object. Key/value expressions evaluated per context; same key → values grouped. See [sorting-grouping](sorting-grouping.md).

## `*` and `**`

- `*`: all property values of context object.
- `**`: descendants (recursive).

```jsonata
Address.*
**.Postcode
```

## `%` (Parent)

Parent of current context (enclosing object). Must be statically resolvable.

```jsonata
Account.Order.Product.{ 'Order': %.OrderID, 'Account': %.%.`Account Name` }
```

## `#` (Position) and `@` (Context binding)

- `#$var`: bind current index to `$var` for later stages.
- `@$var`: bind current context to `$var`; enables joins.

```jsonata
library.books#$i['Kernighan' in authors].{ 'title': title, 'index': $i }
library.loans@$l.books@$b[$l.isbn=$b.isbn].{ 'title': $b.title, 'customer': $l.customer }
```
