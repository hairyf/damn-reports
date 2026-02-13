# sources.json and single source format

This document describes the top-level structure of `sources.json` and the expected format of a single source entry.

## sources.json top-level structure

- The file `sources.json` is a **JSON array**.
- Each element is a **source definition object**.
- Each source is uniquely identified by its `id` field.

Example (simplified):

```json
[
  {
    "id": "damn_reports_git_directory",
    "name": "Damn Reports Git Directory",
    "tool": "git_directory",
    "params": {
      "repository": "D:/damn-reports",
      "author": "hairyf"
    },
    "createAt": "2026-02-12T00:00:00.000Z",
    "updateAt": "2026-02-12T00:00:00.000Z"
  }
]
```

## Single source definition

Each source definition has the following fields:

- `id` (string)  
  - Unique identifier; used by `/source get`, `/source set`, etc.

- `name` (string)  
  - Human-readable name.

- `tool` (string)  
  - Associated collector type (tool id in `tools.json`).

- `params` (object)  
  - Parameters for this source; keys are determined by the corresponding tool’s `definition`.  
  - E.g. for `git_directory` tool: `repository`, `author`, etc.

- `createAt` (string)  
  - ISO 8601 timestamp, creation time.

- `updateAt` (string)  
  - ISO 8601 timestamp, last update time.

## Relationship to tools.json

- `source.tool` refers to a tool id in `tools.json`.
- `source.params` fields should match that tool’s `definition` parameters and are used at execution time to fill `{{...}}` placeholders in the `executor`.
