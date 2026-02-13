# tools.json and single tool format

This document describes the structure of `tools.json` and the expected format
of a single tool definition.

## tools.json top-level structure

- The file `tools.json` is a **single JSON object**.
- Each property key is a **tool id** (string).
- Each property value is a **tool definition object**.

Example (simplified):

```json
{
  "git_directory": {
    "name": "Git Directory Reader",
    "description": "Read Git commits and diffs from a local Git repository",
    "type": "exec",
    "definition": {
      "repository": { "type": "string", "description": "The local Git repository path" },
      "author": { "type": "string", "description": "The author name to filter commits" }
    },
    "executor": {
      "command": "git",
      "args": ["-C", "{{repository}}", "log", "--since=midnight", "--format=%h%x09%s%x09%an%x09%at", "--author={{author}}"]
    },
    "transformer": "..."
  }
}
```

## Single tool definition

Each tool definition has the following fields:

- `name` (string)  
  - Human-readable name of the tool.

- `description` (string)  
  - Short description of what the tool does.

- `type` (string)  
  - Execution type of the tool.  
  - Current supported values:
    - `"exec"` – Run a system command (e.g. `git`, `node`).
    - `"http"` – Perform an HTTP request.

- `definition` (object)  
  - Declarative definition of the tool parameters.  
  - Keys are parameter names.  
  - Parameter schema:
    - `type` (string) – e.g. `"string"`, `"number"`, `"boolean"`.
    - `description` (string) – description of the parameter.
    - `optional` (boolean, optional) – if `true`, parameter may be omitted; when absent, an empty string is used in templates.
    - `default` (any, optional) – when parameter is omitted or empty, this value is used.
  - If both `optional` and `default` are set, `default` takes precedence when the parameter is absent.

- `files` (optional, array of strings)  
  - Additional files needed by the tool (e.g. helper scripts).  
  - Paths are relative to the workspace resource root.  
  - **For complex executors**: prefer adding a Node script under `tools/` and listing it here; use `executor.command: "node"` and `executor.args: ["./tools/script.js", ...]`.

- `executor` (object)  
  - How to call the underlying system or HTTP layer.
  - Shape depends on `type`:

  For `"exec"` tools:

  ```json
  {
    "command": "git",
    "args": ["-C", "{{repository}}", "log", "..."]
  }
  ```

  For `"http"` tools:

  ```json
  {
    "baseUrl": "https://api.example.com",
    "method": "GET",
    "path": "/resource/{{id}}",
    "headers": {
      "Authorization": "{{token}}"
    },
    "query": {
      "param": "{{value}}"
    },
    "body": {
      "field": "{{payload}}"
    }
  }
  ```

  - `{{...}}` placeholders are resolved using the tool parameters at execution time.

- `transformer` (string, JSONata expression)  
  - A JSONata expression used to transform the raw executor output into a
    normalized structure.
  - The transformer is evaluated after the executor returns data.
  - It should produce either:
    - A single object, or
    - An array of objects.

Each result object should have at least:

- `summary` (string) – short human-readable summary.
- `createdAt` (number) – UNIX timestamp in milliseconds.
- `data` (any) – raw or structured payload associated with the item.

## JSONata and the jsonata skill

- The `transformer` field is pure JSONata text.  
- Use the `jsonata` skill (`tauri/workspace/skills/jsonata`) when:
  - Designing new transformers.
  - Debugging or refactoring existing transformers.
  - Looking up operators, functions, or common patterns.

Recommended practice:

1. Prototype and test JSONata expressions using the `jsonata` skill and/or
   external tools such as `docs.jsonata.org` and `try.jsonata.org`.
2. Once stable, copy the final expression into the `transformer` field of
   the tool definition.

