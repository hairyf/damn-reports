# /source operations

This document defines the high-level `/source` operations and how to implement them using the workspace tools:

- `read`
- `write`
- `edit`
- `grep`

All paths and examples assume you are operating inside the Tauri workspace.

## Paths and tools

- `sources.json` logical path:
  - Repository location: `./sources.json`.
  - For `read`, `write`, `edit`, `grep`:
    - Use `path: "sources.json"`.

- Tools:
  - `read` – load current JSON text.
  - `write` – overwrite file with new content.
  - `edit` – small, controlled text replacement.
  - `grep` – locate patterns (e.g. a specific `id`) in the file.

## /source get_all

**Purpose**

Return the full `sources.json` array (all source entries).

**Implementation**

1. Call `read`:
   - Input: `{"path": "sources.json"}`
2. Parse the returned string as JSON.
3. Return the parsed array.
   - Elements are source definitions; format see `source-schema.md`.

**Notes**

- This operation does not mutate data; use `/source add` or `/source set` for changes.

## /source add

**Purpose**

Add a new source entry to `sources.json`.

**Inputs (conceptual)**

- `source` (object) – Source definition conforming to `source-schema.md`, must include `id`.
- If `createAt` / `updateAt` are omitted, set them to current ISO 8601 time.

**Preferred implementation (read–modify–write)**

1. Call `/source get_all` (or `read` directly) to get current JSON text.
   - `read` input: `{"path": "sources.json"}`
2. Parse the text as an array `sources`.
3. Check that no entry with the same `id` exists:
   - If it does, return an error or “id already exists” and do not add.
4. Fill in `createAt` and `updateAt` for the new source if missing.
5. Append: `sources.push(source)` (or equivalent).
6. Serialize `sources` to a JSON string (pretty-printed if possible).
7. Call `write` to persist:
   - Input: `{"path": "sources.json", "content": "<stringified sources>"}`
8. Optionally `read` and parse again to confirm the new entry exists.

**Testing recommendation**

- After adding, use the **tool skill**’s `exec_tool` to run the collector once and confirm it works.
- Call workspace tool `exec_tool` with:
  - `toolid`: the new source’s `tool` field (tool id in `tools.json`);
  - `params`: the new source’s `params` object (aligned with the tool’s `definition`).
- I.e. use `source.params` as the `params` argument to `exec_tool` to run one collection and verify the configuration.

**Using edit for targeted insertion (optional)**

Only when you can identify a unique, stable substring to replace:

1. Use `read` to get the **exact** current text of `sources.json`.
2. Build `oldContent` (e.g. the closing `]` or the last source entry plus comma).
3. Build `newContent` that inserts the new source into the array (mind commas and valid JSON).
4. Call `edit`:
   - Input: `{"path": "sources.json", "oldContent": "<old>", "newContent": "<new>"}`
5. Optionally `read` and parse to validate the file is still valid JSON.

## /source get

**Purpose**

Retrieve a single source by `id`.

**Inputs (conceptual)**

- `id` (string) – The `id` of the source to fetch.

**Implementation**

1. Call `read`:
   - Input: `{"path": "sources.json"}`
2. Parse the text as array `sources`.
3. Find the element where `item.id === id`.
4. Return:
   - The source object if found;
   - `null` or an explicit “not found” response if missing.

**Using grep for quick lookup (optional)**

- To quickly locate the raw snippet for an id in the file, use `grep`:
  - Input: `{"path": "sources.json", "pattern": "\"<id>\""}`
- The authoritative value should still come from the parsed JSON.

## /source set

**Purpose**

Update an existing source by `id`.

**Inputs (conceptual)**

- `id` (string) – The `id` of the source to update.
- `source` (object) – New full source definition (full replacement), or a partial object to merge into the existing one.

**Preferred implementation (read–modify–write)**

1. Call `/source get_all` (or `read` directly) to load current JSON.
2. Parse the text as array `sources`.
3. Find the index where `item.id === id`; if none, return an error or “not found” to avoid accidental add.
4. Replace or merge:
   - **Replace**: `sources[index] = source` (keep or set `id` consistently).
   - **Merge**: `sources[index] = { ...sources[index], ...source }`, and optionally update `updateAt`.
5. Serialize `sources` to a JSON string.
6. Call `write`:
   - Input: `{"path": "sources.json", "content": "<stringified sources>"}`
7. Optionally call `/source get` to confirm the updated value.

**Using edit for small updates (optional)**

Only when the change is small and you can pinpoint the exact snippet:

1. Use `read` and/or `grep` to locate the exact old snippet.
2. Build `oldContent` and `newContent` (including quotes and commas as needed).
3. Call `edit`:
   - Input: `{"path": "sources.json", "oldContent": "<old>", "newContent": "<new>"}`
4. Re-read and parse `sources.json` to validate correctness.
