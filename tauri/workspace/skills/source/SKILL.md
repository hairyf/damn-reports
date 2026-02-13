---
name: source
description: "Manage workspace data sources defined in sources.json: list all sources, add a new source, get a source by id, and update an existing source. Use when you need to maintain the list of collector sources (sources.json) in the Tauri workspace."
---

# Source Skill

This skill describes how to manage **data sources (sources)** stored in `sources.json` in the Tauri workspace and the standard workflow for listing, adding, getting, and updating them.

The goal is to provide a consistent workflow for:

- Reading all source definitions from `sources.json` (get_all)
- Adding a new source (add)
- Getting a single source by id (get)
- Updating an existing source (set)

All instructions assume you are operating inside the Tauri workspace context.

## Files and layout

- `sources.json`: root structure is a **JSON array** of source definitions.
  - In the repository it lives at `tauri/workspace/sources.json`.
  - From workspace tools (read, write, edit) use `path: "sources.json"`.
- **Single source format**: see `references/source-schema.md`.
- **High-level operations** (`/source get_all`, `/source add`, `/source get`, `/source set`): see `references/operations.md`.

## Workspace tools used

These tools are defined in `src/config/tools.ts` and exposed to the agent:

- `read`  
  - Reads a text file under the workspace.  
  - Joins the given path with the `workspace` directory internally.  
  - Use `{"path": "sources.json"}` to read the current sources list.

- `write`  
  - Creates or overwrites a file under the workspace.  
  - Also joins the given path with `workspace`.  
  - Use `{"path": "sources.json", "content": "<updated JSON>"}` to persist changes.

- `edit`  
  - Performs a simple text replacement on a file under the workspace.  
  - Use for small, precise updates.

- `grep`  
  - Searches for a string pattern in a file.  
  - Same path convention as `read`/`write`/`edit`: use `path: "sources.json"`.

## How to use this skill

1. **Understand the schema**  
   - Open `references/source-schema.md` to see the structure of `sources.json` and a single source definition.

2. **Follow the operation recipes**  
   - For concrete workflows, follow `references/operations.md`. It defines:
     - `/source get_all` – read and return all sources
     - `/source add` – add a new source
     - `/source get` – retrieve a single source by id
     - `/source set` – update an existing source by id

3. **Test after adding a source**  
   - Use the **tool skill** (`tauri/workspace/skills/tool`) `exec_tool`: pass the source’s `tool` as `toolid` and `source.params` as `params` to run the collector once and verify the configuration works.

4. **Keep sources.json valid**  
   - Always treat `sources.json` as a **JSON array**.  
   - When adding or updating: read and parse, modify the array in memory, then serialize and write back via `write`; use `edit` only for small, well-localized changes.

For detailed step-by-step procedures for each `/source` operation, see `references/operations.md`.
