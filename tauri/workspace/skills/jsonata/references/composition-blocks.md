---
title: Composition and Blocks
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/composition.md
---

# Composition

Everything is an expression. Combine values, functions, and operators; sub-expressions compose.

## Parentheses

- Override precedence: `(5 + 3) * 4`.
- Compute on context: `Product.(Price * Quantity)` (both from same object).
- **Block**: `(expr1; expr2; expr3)` — evaluate in order; result is last expression.

```jsonata
(
  $p := Product.Price;
  $q := Product.Quantity;
  $p * $q
)
```

Blocks define scope; variables bound inside are local.
