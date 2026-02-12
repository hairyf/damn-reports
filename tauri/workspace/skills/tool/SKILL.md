---
name: tool
description: Manage workspace collector tools defined in tools.json: read all tools, add or update a single tool definition, inspect a single tool, and execute a tool via exec_tool. Use when you need to maintain or run collectors stored in tools.json from the Tauri workspace.
---

# Tool Skill

This skill describes how to manage **collector tools** stored in `tools.json` in the Tauri workspace
and how to execute them via the `exec_tool` runtime tool.

The goal is to provide a consistent workflow for:

- Reading all tool definitions from `tools.json`
- Adding a new tool
- Getting a single tool by id
- Updating an existing tool
- Executing a tool through the `exec_tool` bridge

All instructions in this skill assume you are operating inside the Tauri workspace context.

## Files and layout

- `tools.json`: root JSON object mapping **tool ids** to tool definitions.
  - In the repository it lives at `tauri/workspace/tools.json`.
  - From inside the workspace tools (`read`, `write`, `edit`) you should use `path: "tools.json"`.
- **Single tool format**: see `references/tool-schema.md`.
- **High-level operations** (`/tool get_all`, `/tool add`, `/tool get`, `/tool set`, `/tool exec`): see `references/operations.md`.

## Workspace tools used

These tools are defined in `src/config/tools.ts` and exposed to the agent:

- `read`  
  - Reads a text file under the workspace.  
  - Joins the given path with the `workspace` directory internally.  
  - Use it with `{"path": "tools.json"}` to read the current collectors.

- `write`  
  - Creates or overwrites a file under the workspace.  
  - Also joins the given path with `workspace`.  
  - Use it with `{"path": "tools.json", "content": "<updated JSON>"}` to persist changes.

- `edit`  
  - Performs a simple text replacement on a file under the workspace.  
  - Joins the given path with `workspace`.  
  - Helpful for small, precise updates when you know the exact old and new snippets.

- `grep`  
  - Searches for a string pattern in a file.  
  - **Important**: `grep` does **not** automatically prefix `workspace`, so you must pass the full relative resource path.  
  - To search inside `tools.json`, use `{"path": "workspace/tools.json", "pattern": "<toolid or text>"}`.

- `exec_tool`  
  - Executes a tool definition stored in `tools.json` by id.  
  - It reads `tools.json`, finds the requested tool, calls the underlying executor (`exec` or `http`),
    then applies the JSONata `transformer` to normalize the result.

- `jsonata` skill  
  - Use the `jsonata` skill (`tauri/workspace/skills/jsonata`) when designing, validating, or debugging
    the `transformer` expressions used by tools in `tools.json`.

## How to use this skill

1. **Understand the schema**  
   - Open `references/tool-schema.md` to see the structure of `tools.json` and a single tool definition.
   - Make sure any new or updated tool matches this format.

2. **Follow the operation recipes**  
   - For concrete workflows, follow `references/operations.md`.  
   - It defines the canonical behavior of:
     - `/tool get_all` – read and return all tools
     - `/tool add` – insert a new tool
     - `/tool get` – retrieve a single tool by id
     - `/tool set` – update an existing tool
     - `/tool exec` – execute a tool via `exec_tool`

3. **Use JSONata correctly**  
   - When working on the `transformer` field of a tool, use the `jsonata` skill to look up syntax,
     functions, and patterns.  
   - Ensure the transformer always returns data in the normalized form:
     - Either a single object
     - Or an array of objects
     - Each object should include at least: `summary: string`, `createdAt: number`, `data: any`.

4. **Keep tools.json well-structured**  
   - Always treat `tools.json` as a **single JSON object** whose keys are tool ids.  
   - When adding or updating tools, prefer:
     - Parsing the existing JSON
     - Modifying it structurally
     - Then writing back a serialized, pretty-printed JSON string via `write`.
   - Use `edit` only for small, controlled text replacements when you know the exact before/after content.

For detailed step-by-step procedures for each `/tool` operation, see `references/operations.md`.

