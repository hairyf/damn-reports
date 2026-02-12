---
title: Overview
category: core
source: https://github.com/jsonata-js/jsonata/blob/master/docs/overview.md
---

# JSONata Overview

JSONata is a lightweight **query and transformation language** for JSON data. Inspired by XPath 3.1 location-path semantics, it supports compact queries, built-in operators/functions, and output shaped as any JSON structure. User-defined functions extend it for arbitrary query/transform tasks.

- **Try**: [try.jsonata.org](http://try.jsonata.org/)
- **Docs**: [docs.jsonata.org](http://docs.jsonata.org/)
- **NPM**: `npm install jsonata`

## Quick example

```javascript
const jsonata = require('jsonata');

const data = {
  example: [
    { value: 4 },
    { value: 7 },
    { value: 13 }
  ]
};

(async () => {
  const expression = jsonata('$sum(example.value)');
  const result = await expression.evaluate(data);  // 24
})();
```

## Why use JSONata

- **Declarative**: Focus on what to select/transform, not control flow.
- **Composable**: Paths, functions, and operators combine into expressions.
- **JSON in/out**: Input and output are standard JSON; any valid JSON is valid JSONata (superset).
