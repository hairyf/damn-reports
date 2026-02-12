---
title: JavaScript API (Embedding)
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/embedding-extending.md
---

# Embedding and Extending

## Parse

```javascript
const expression = jsonata('$sum(example.value)');
```

Invalid expression throws `Error` with `code`, `position`, `token`, `message`.

## Evaluate

```javascript
const result = await expression.evaluate(input);
const result = await expression.evaluate(input, bindings);
expression.evaluate(input, bindings, (err, value) => { ... });
```

- `input`: JSON-like value (no cycles/functions).
- `bindings`: optional `{ name: value }` for variables/functions.
- Callback form: async, no return value; result in callback.

## Assign and registerFunction

```javascript
expression.assign('a', 4);
expression.assign('b', () => 78);

expression.registerFunction('greet', () => 'Hello world');
expression.registerFunction('add', (a, b) => a + b, '<nn:n>');
```

`assign`: bind value to name. `registerFunction`: bind with optional **signature** for argument type checking. Signature format: `<params:return>` (e.g. `n` number, `s` string, `a` array, `o` object, `f` function, `j` any JSON, `x` any; `+` one-or-more, `?` optional, `-` use context).

## Expression methods

- `evaluate(input[, bindings[, callback]])`
- `assign(name, value)`
- `registerFunction(name, implementation[, signature])`
- `ast()` — returns AST (ExprNode).
