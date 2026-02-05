# AGENTS

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>hairy-react-lib</name>
<description>Comprehensive skills for working with @hairy/react-lib React hooks and components</description>
<location>project</location>
</skill>

<skill>
<name>hairy-utils</name>
<description>Comprehensive skills for working with @hairy/utils core utilities</description>
<location>project</location>
</skill>

<skill>
<name>react-use</name>
<description>Collection of essential React Hooks for sensors, UI, animations, side-effects, lifecycles, and state management</description>
<location>project</location>
</skill>

<skill>
<name>tailwindcss</name>
<description>Tailwind CSS utility-first CSS framework. Use when styling web applications with utility classes, building responsive designs, or customizing design systems with theme variables.</description>
<location>project</location>
</skill>

<skill>
<name>tauri</name>
<description>Cross-platform app toolkit with Rust backend and WebView frontend. Use when building or maintaining Tauri apps, configuring IPC/security, or developing plugins.</description>
<location>project</location>
</skill>

<skill>
<name>valtio-define</name>
<description>Comprehensive skills for working with valtio-define</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
