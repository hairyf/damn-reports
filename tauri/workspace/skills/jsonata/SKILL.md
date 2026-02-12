---
name: jsonata
description: JSONata query and transformation language for JSON. Use when writing or debugging JSONata expressions, embedding in JS/Node, or transforming JSON data.
---

# JSONata Skill

JSONata is a lightweight **query and transformation language** for JSON. This skill covers the language, path operators, built-in functions, and the JavaScript embedding API.

**Source**: [jsonata-js/jsonata](https://github.com/jsonata-js/jsonata)  
**Docs**: [docs.jsonata.org](http://docs.jsonata.org/) | **Try**: [try.jsonata.org](http://try.jsonata.org/)

---

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Overview | What JSONata is, quick start | [overview](references/overview.md) |
| Simple queries | Object/array navigation, `$`, indices, ranges | [simple-queries](references/simple-queries.md) |
| Path operators | Map `.`, filter `[]`, sort `^()`, reduce `{}`, `*` `**`, `%` `#` `@` | [path-operators](references/path-operators.md) |
| Expressions | Strings `&`, numbers, boolean in expressions | [expressions-operators](references/expressions-operators.md) |
| Comparison | `=`, `!=`, `<`, `<=`, `>`, `>=`, `in`; deep equality | [comparison-operators](references/comparison-operators.md) |
| Other operators | `&` `? :` `?:` `??` `:=` `~>` transform `\|...\|` | [other-operators](references/other-operators.md) |
| Predicates & wildcards | Filter `[expr]`, `*` and `**` | [predicates-wildcards](references/predicates-wildcards.md) |
| Construction | Array `[]` and object `{}` constructors, JSON literals | [construction](references/construction.md) |
| Processing model | Types, sequences, flattening, path stages | [processing-model](references/processing-model.md) |
| Composition | Parentheses, blocks `( ; )` | [composition-blocks](references/composition-blocks.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Programming | Variables `$var`, conditionals, functions, recursion, partial application, chaining | [programming](references/programming.md) |
| Embedding API | `jsonata(str)`, `evaluate()`, `assign()`, `registerFunction()`, signatures | [embedding-api](references/embedding-api.md) |
| Sorting & grouping | Order-by, reduce grouping, aggregation | [sorting-grouping](references/sorting-grouping.md) |
| Higher-order | `$map`, `$filter`, `$single`, `$reduce`, `$sift` | [higher-order-functions](references/higher-order-functions.md) |
| Array functions | `$count`, `$append`, `$sort`, `$reverse`, `$shuffle`, `$distinct`, `$zip` | [array-functions](references/array-functions.md) |
| Boolean | `$boolean`, `$not`, `$exists`; `and`, `or` | [boolean-functions](references/boolean-functions.md) |
| Numeric functions | `$number`, `$abs`, `$floor`, `$ceil`, `$round`, `$power`, `$sqrt`, `$random`, `$formatNumber`, etc. | [numeric-functions](references/numeric-functions.md) |
| Object & utility | `$keys`, `$lookup`, `$spread`, `$merge`, `$each`, `$type`, `$error`, `$assert` | [object-functions](references/object-functions.md) |
| String functions | `$string`, `$length`, `$substring`, `$split`, `$join`, `$match`, `$replace`, base64/URL | [string-functions](references/string-functions.md) |
| Date/Time | `$now`, `$millis`, `$fromMillis`, `$toMillis`, ISO 8601, picture strings | [date-time](references/date-time.md) |
| Built-in overview | Summary and links to full function docs | [built-in-functions](references/built-in-functions.md) |
| Regex | `/regex/flags`, predicates, `$match`, `$contains`, etc. | [regex](references/regex.md) |

## Advanced

| Topic | Description | Reference |
|-------|-------------|-----------|
| Function signatures | `<params:return>`, type symbols, optional/context args | [embedding-api](references/embedding-api.md), [programming](references/programming.md) |
| Closures, tail recursion | Lexical scope, tail-call optimization | [programming](references/programming.md) |
| Transform operator | Deep copy + targeted update/delete | [other-operators](references/other-operators.md) |
