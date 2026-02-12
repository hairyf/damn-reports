---
title: Expressions and Operators
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/expressions.md
---

# Expressions and Operators

## Strings

- Literals: `"..."` or `'...'` (JSON escaping).
- Concatenation: `&` (casts to string).

```jsonata
FirstName & ' ' & Surname
Address.(Street & ', ' & City)
5 & 0 & true
```
→ `"50true"`

## Numbers

Literals as in JSON. Operators: `+`, `-`, `*`, `/`, `%`.

```jsonata
Numbers[0] + Numbers[1]
Numbers[2] % Numbers[5]
```

## Comparison

Return boolean: `=`, `!=`, `<`, `<=`, `>`, `>=`, `in`.

```jsonata
Numbers[0] = Numbers[5]
"01962 001234" in Phone.number
```

## Boolean

- `and`, `or`.
- `not` is a function: `$not(expr)`.

```jsonata
(Numbers[2] != 0) and (Numbers[5] != Numbers[1])
```
