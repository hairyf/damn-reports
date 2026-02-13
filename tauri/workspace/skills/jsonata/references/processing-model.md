---
title: Processing Model and Types
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/processing.md
---

# Processing Model

## Types

string, number, boolean, null, object, array, **function** (first-class).

## Sequences

Path expressions return a **result sequence** (zero or more values). Rules:

1. **Empty sequence**: nothing; no output; absent key in result object.
2. **Singleton**: equivalent to the single value (no wrapper array).
3. **Multiple values**: output as JSON array (still a sequence for next stage).
4. **Flattening**: sub-sequences are flattened into the outer sequence.

Arrays **constructed** in the expression (e.g. `.[x]`) stay as arrays until used as context, then the next stage produces a sequence.

## Path stages (order)

| Stage   | Syntax     | Action |
|--------|------------|--------|
| Map    | `seq.expr` | Evaluate RHS per item; flatten. |
| Filter | `seq[expr]`| Keep items where predicate is true. |
| Sort   | `seq^(expr)` | Reorder by expression(s). |
| Index  | `seq#$var` | Bind position to variable. |
| Join   | `seq@$var` | Bind context to variable (after map only). |
| Reduce | `seq{ k:v }` | Group/aggregate to one object; path ends. |

Filter binds tighter than map: `books.authors[0]` = first author of **each** book. Use `(books.authors)[0]` for first author overall. Variables from `#` and `@` go out of scope at path end; reduce ends the path.
