---
title: Numeric Functions
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/numeric-functions.md
---

# Numeric Functions

## $number(arg)

Casts to number. Strings (legal JSON number, or 0x/0o/0b), boolean (true→1, false→0). Context if omitted.

```jsonata
$number("5")
$number("0x12")
```

## $abs(number), $floor(number), $ceil(number)

Absolute value; round down; round up. Context as first arg when omitted.

```jsonata
$floor(-5.3)
$ceil(5.3)
```

## $round(number [, precision])

Rounds; default precision 0. Negative precision = left of decimal. Half-to-even rounding.

```jsonata
$round(123.456, 2)
$round(123.456, -1)
```

## $power(base, exponent), $sqrt(number)

Power; square root (negative throws). Base can be context.

## $random()

Returns n where 0 ≤ n < 1.

## $formatNumber(number, picture [, options])

Formats number per picture string (XPath fn:format-number style). Optional locale options object.

```jsonata
$formatNumber(12345.6, '#,###.00')
$formatNumber(-34.555, "#0.00;(#0.00)")
```

## $formatBase(number [, radix]), $formatInteger(number, picture)

Radix 2–36; or picture for integer (e.g. 'w' for words, 'I' for Roman).

## $parseInteger(string, picture)

Parses string to integer using picture (same as $formatInteger picture).
