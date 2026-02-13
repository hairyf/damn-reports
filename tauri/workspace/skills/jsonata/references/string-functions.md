---
title: String Functions
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/string-functions.md
---

# String Functions

Most accept context as first argument when omitted (e.g. `str.$length()`).

## Core

- **$string(arg, prettify)** — Cast to string; prettify=true for indented JSON.
- **$length(str)** — Character count.
- **$substring(str, start [, length])** — Zero-based; negative start from end.
- **$substringBefore(str, chars)**, **$substringAfter(str, chars)** — Before/after first occurrence.
- **$uppercase(str)**, **$lowercase(str)**, **$trim(str)** — Trim normalizes whitespace (tabs/CR/LF → space, collapse, trim edges).

## Padding and splitting

- **$pad(str, width [, char])** — Pad to |width|; positive = right, negative = left.
- **$split(str, separator [, limit])** — Separator can be string or regex; empty string → array of chars.
- **$join(array [, separator])** — Join strings; default separator "".

## Pattern matching

- **$contains(str, pattern)** — pattern string or regex; returns boolean.
- **$match(str, pattern [, limit])** — Returns array of match objects: `match`, `index`, `groups` (capturing groups).
- **$replace(str, pattern, replacement [, limit])** — Replacement: string (use $0, $1 for regex groups; $$ for literal $) or function(matchObj)→string.

```jsonata
$replace("John Smith", /(\w+)\s(\w+)/, "$2, $1")
$replace("265USD", /([0-9]+)USD/, "$$$1")
```

## Encoding

- **$base64encode()**, **$base64decode()** — String ↔ base64 (ASCII bytes; Unicode limited).
- **$encodeUrlComponent(str)**, **$decodeUrlComponent(str)** — URL component encoding.
- **$encodeUrl(str)**, **$decodeUrl(str)** — Full URL encoding.

## $eval(expr [, context])

Parses and evaluates string as JSON or JSONata expression; optional context override.
