---
title: Date/Time
category: features
source: https://github.com/jsonata-js/jsonata/blob/master/docs/date-time.md, date-time-functions.md
---

# Date/Time

JSON has no date type; use ISO 8601 strings or millis. Timestamp is fixed at start of expression evaluation (all $now()/$millis() in one evaluation return same value).

## $now([picture [, timezone]])

Current UTC timestamp as ISO 8601 string. With picture/timezone, formats like $fromMillis().

```jsonata
$now()
```

## $millis()

Milliseconds since Unix epoch (1 Jan 1970 UTC) as number.

## $fromMillis(number [, picture [, timezone]])

Millis → formatted string. Default = ISO 8601. Picture: XPath fn:format-dateTime syntax. Timezone: "±HHMM".

```jsonata
$fromMillis(1510067557121)
$fromMillis(1510067557121, '[M01]/[D01]/[Y0001] [h#1]:[m01][P]')
$fromMillis(1510067557121, '[H01]:[m01]:[s01] [z]', '-0500')
```

## $toMillis(timestamp [, picture])

String → millis. Default = ISO 8601. Picture for other formats (e.g. '[D]/[M]/[Y]' for 10/12/2018).

```jsonata
$toMillis("2017-11-07T15:07:54.972Z")
$toMillis('10/12/2018', '[D]/[M]/[Y]') ~> $fromMillis('[M]/[D]/[Y]')
```
