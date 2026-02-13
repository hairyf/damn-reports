# /tool operations

This document defines the high-level `/tool` operations and how to
implement them using the workspace tools:

- `read`
- `write`
- `edit`
- `grep`
- `exec_tool`

All paths and examples assume you are operating inside the Tauri workspace.

## Common paths and tools

- `tools.json` logical path:
  - Repository location: `tauri/workspace/tools.json`.
  - For `read`, `write`, `edit`, `grep`:
    - Use `path: "tools.json"` (all these tools internally prefix `workspace`; see `src/utils/fs-extra.ts`).

- Helper tools:
  - `read` – load current JSON content as text.
  - `write` – overwrite file with new content.
  - `edit` – small, controlled text replacement.
  - `grep` – locate patterns (e.g. a specific `toolid`) in the raw file.
  - `exec_tool` – execute a tool by id via the runtime execution layer.

## /tool get_all

**Purpose**

Return the complete `tools.json` object (all collectors).

**Implementation**

1. Call `read`:

   - Input:
     - `{"path": "tools.json"}`

2. Parse the returned string as JSON.

3. Return the parsed object directly.  
   - Keys are tool ids.  
   - Values are tool definitions (see `tool-schema.md`).

**Notes**

- Do not mutate the result in this operation.  
- Use `/tool add` or `/tool set` for modifications.

## /tool add

**Purpose**

Add a new tool definition under a given tool id.

**Executor strategy**

- For **simple** logic (single command, few args, straightforward output): use inline `executor` with `command` and `args`.
- For **complex** logic (multi-step, branching, parsing, JSON shaping): prefer writing a Node.js script under `tools/`, then reference it via `executor.command: "node"` and `executor.args: ["./tools/script.js", ...]`. Add the script to `files`. See SKILL.md section "Executor complexity: prefer Node scripts".

**Inputs (conceptual)**

- `toolid` (string) – key under which the tool will be stored.
- `tool` (object) – tool definition matching the schema in `tool-schema.md`.

**Preferred implementation (read–modify–write)**

1. Call `/tool get_all` (or `read` directly) to load the current JSON:

   - `read` input:
     - `{"path": "tools.json"}`

2. Parse the text as JSON into `tools`.

3. Set the new tool:

   - `tools[toolid] = tool`

4. Serialize `tools` back to a JSON string (pretty-printed if possible).

5. Call `write` to persist:

   - Input:
     - `{"path": "tools.json", "content": "<stringified tools>"}`

6. Optionally re-read and parse `tools.json` to confirm the new entry exists.

**Using edit for targeted insertion (optional)**

For small changes where you want to minimize the diff:

1. Use `read` to capture the **exact** current text of `tools.json`.
2. Construct `oldContent` as a stable substring you want to replace
   (for example, the closing `}` or a known trailing entry).
3. Construct `newContent` that inserts the new tool definition into the object.
4. Call `edit`:

   - Input:
     - `{"path": "tools.json", "oldContent": "<old>", "newContent": "<new>"}`

5. Optionally call `read` and parse as JSON to validate the file is still valid.

Use the `edit`-based approach only when you are confident the `oldContent`
substring is unique and stable.

## /tool get

**Purpose**

Retrieve a single tool definition by id.

**Inputs (conceptual)**

- `toolid` (string) – key of the desired tool.

**Implementation**

1. Call `read`:

   - Input:
     - `{"path": "tools.json"}`

2. Parse the text as JSON object `tools`.

3. Return:

   - `tools[toolid]` if it exists.
   - `null` or an explicit “not found” response if the id is missing.

**Using grep for quick inspection (optional)**

- To quickly locate the raw text for a tool id, use `grep`:

  - Input:
    - `{"path": "tools.json", "pattern": "\"<toolid>\""}`  

- This is useful for understanding the surrounding context before editing,
  but the authoritative value should still come from the parsed JSON.

## /tool set

**Purpose**

Update an existing tool definition by id.

**Inputs (conceptual)**

- `toolid` (string) – key of the tool to update.
- `tool` (object) – new tool definition (full replacement), or a partial object
  that you merge into the existing one.

**Preferred implementation (read–modify–write)**

1. Call `/tool get_all` (or `read` directly) to load the current JSON.
2. Parse the text as JSON object `tools`.
3. Validate that `tools[toolid]` exists (if you want to avoid accidental adds).
4. Replace or merge:

   - **Replace**:
     - `tools[toolid] = tool`
   - **Merge**:
     - `tools[toolid] = { ...tools[toolid], ...tool }`

5. Serialize `tools` back to a JSON string.
6. Call `write`:

   - Input:
     - `{"path": "tools.json", "content": "<stringified tools>"}`

7. Optionally call `/tool get` to confirm the new value.

**Using edit for small updates (optional)**

For very small, known changes (e.g. updating a description or a single
JSONata transformer string):

1. Use `read` and/or `grep` to locate the exact old snippet.
2. Build `oldContent` and `newContent` with the exact text you want to
   replace (including surrounding quotes if needed).
3. Call `edit`:

   - Input:
     - `{"path": "tools.json", "oldContent": "<old>", "newContent": "<new>"}`

4. Re-parse `tools.json` with `read` + JSON parse to validate correctness.

## /tool exec

**Purpose**

Execute a tool defined in `tools.json` using the runtime `exec_tool` bridge.

**Inputs (conceptual)**

- `toolid` (string) – id of the tool to execute.
- `params` (object, optional) – key/value pairs for the tool parameters as
  defined in the tool’s `definition` field.

**Implementation**

1. Optionally validate the tool exists:

   - Call `/tool get` with the given `toolid`.  
   - If it does not exist, return an error or a “not found” response.

2. Call the `exec_tool` workspace tool:

   - Input:
     - `{"toolid": "<toolid>", "params": { /* parameter values */ }}`

3. `exec_tool` will:

   - Read `tools.json`.
   - Locate the tool by `toolid`.
   - Execute the underlying `executor`:
     - `exec` command for `"exec"` tools.
     - HTTP request for `"http"` tools.
   - Apply the JSONata `transformer` to normalize the output.

4. Return the result from `exec_tool` as the `/tool exec` response.

**Result format**

- Should already be in the normalized structure defined by the tool’s
  `transformer`:
  - A single object or an array of objects.
  - Each object should contain:
    - `summary` – short description.
    - `createdAt` – timestamp in milliseconds.
    - `data` – raw/structured data payload.

**Error handling**

- `exec_tool` will return detailed error messages on failure, including:
  - The tool id and name
  - The tool type (`exec` / `http`)
  - The provided parameters
  - The underlying error message (command failure, transformer failure, etc.)
- For `exec` type tools: if the command fails, the error will include
  the exit code, stderr, and stdout of the command.
- For transformer failures: the error will include the raw output preview
  and the JSONata expression that failed.
- If a tool is not found in `tools.json`, the error will list all available
  tool ids.
- If required parameters are missing, the error will list the missing
  parameters with their descriptions.

**Troubleshooting common issues**

- **UTF-8 encoding errors** (Windows): The exec layer sets `chcp 65001`,
  `$OutputEncoding`, `[Console]::OutputEncoding` and `[Console]::InputEncoding`
  to UTF-8. If encoding issues persist, check if the tool's output contains
  non-UTF-8 characters from the system locale.
- **Path not found**: Ensure the `executor.args` paths are relative to the
  workspace root (e.g. `./tools/script.js`, not `./tool/script.js`).
  Also ensure the `files` array matches the actual paths.
- **Command not found**: The exec layer uses PowerShell on Windows and sh
  on Unix. Ensure the command is available in the system PATH.

**Working with JSONata**

- When adjusting the `transformer` for a tool:
  - Use the `jsonata` skill for language details and patterns.
  - Ensure the final expression always yields the normalized shape above.

