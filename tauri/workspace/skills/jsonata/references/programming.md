---
title: Variables, Functions, Conditionals
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/programming.md
---

# Programming Constructs

## Variables

- Names starting with `$`: variables. `$` = current context, `$$` = root.
- Bind: `$var := value`. Scope: block where bound.

```jsonata
Invoice.(
  $p := Product.Price;
  $q := Product.Quantity;
  $p * $q
)
```

## Conditionals

- **Ternary**: `predicate ? expr1 : expr2`
- **Elvis (default)**: `expr1 ?: expr2` ≡ `expr1 ? expr1 : expr2`
- **Coalesce**: `expr1 ?? expr2` ≡ `$exists(expr1) ? expr1 : expr2`

```jsonata
$.Price > 100 ? "Premium" : "Basic"
$.Category ?: "Uncategorized"
($sum(Product.Rating) / $count(Product.Rating)) ?? 0
```

## Functions

- Invoke: `$uppercase("Hello")`, `$sum([1,2,3])`.
- Define: `function($l, $w, $h){ $l * $w * $h }`.
- Assign: `$volume := function($l, $w, $h){ $l * $w * $h }; $volume(10,10,5)`.
- **Recursion**: named function can call itself (tail calls optimized).
- **Partial application**: `$substring(?, 0, 5)` — placeholder `?`; returns function.
- **Chaining**: `value ~> $funcA ~> $funcB` ≡ `$funcB($funcA(value))`.
- **Composition**: `$funcC := $funcA ~> $funcB` ≡ `function($arg){ $funcB($funcA($arg)) }`.

Functions are closures (lexical scope). Optional **signature** string for type checking: `<params:return>` (e.g. `<nn:n>`, `<a<n>:n>`). Comments: `/* ... */`.
