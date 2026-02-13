---
title: Other Operators (Chain, Transform, Conditionals, Binding)
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/other-operators.md
---

# Other Operators

## & (Concatenation)

Join strings; operands cast via $string().

## ? : (Conditional)

`test ? exprT : exprF` — test cast to boolean; then evaluate one branch.

## ?: (Elvis / Default)

`expr1 ?: expr2` — if expr1 is truthy return expr1, else expr2. Fallback for null/false/0/''.

## ?? (Coalescing)

`expr1 ?? expr2` — if expr1 is defined (not undefined) return expr1, else expr2. Does not replace 0, false, ''.

## := (Variable binding)

Bind RHS to variable on LHS. LHS must be `$` + valid name. Scoped to block.

```jsonata
$five := 5
$square := function($n) { $n * $n }
```

## ~> (Chain)

Pass LHS as first argument to RHS function. Enables readable pipelines.

```jsonata
Customer.Email ~> $substringAfter("@") ~> $substringBefore(".") ~> $uppercase()
Account.Order.Product.(Price * Quantity) ~> $sum()
```

Function composition (no value on LHS of first): `$uppertrim := $trim ~> $uppercase`.

## ~> | location | update [, delete] | (Transform)

Creates a function that deep-copies an object and applies targeted updates. **location** selects object(s) to change; **update** is object merged into each; **delete** optional array of keys to remove. Same merge semantics as $merge().

```jsonata
payload ~> |Account.Order.Product|{'Price': Price * 1.2}|
$ ~> |Account.Order.Product|{'Total': Price * Quantity}, ['Price', 'Quantity']|
```

Multiple transforms can be chained. Update expressions use original values (declarative).
