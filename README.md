# Starter Tauri (Vite + React + HeroUI)

This is a starter template for building modern desktop applications with Tauri, Vite, React, and HeroUI (v2). It provides a pre-configured UI stack, fast dev experience, and the ability to ship native installers across platforms.

[Try the base UI on CodeSandbox](https://githubbox.com/heroui-inc/vite-template)

## Technologies Used

- [Vite](https://vitejs.dev/guide/)
- [HeroUI](https://heroui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org)
- [Framer Motion](https://www.framer.com/motion)
- [Tauri](https://tauri.app/)

## Prerequisites

- Node.js 18+ and a package manager (`npm`, `yarn`, `pnpm`, or `bun`)
- Rust toolchain (stable) installed via [rustup](https://rustup.rs)
- Platform-specific Tauri prerequisites: see [Tauri prerequisites](https://tauri.app/start/prerequisites/)
  - Windows: Visual Studio Build Tools with Desktop development with C++, WebView2
  - macOS: Xcode Command Line Tools
  - Linux: Required system libraries (link above)

## How to Use (Web + Tauri)

To clone the project, run the following command:

```bash
git clone https://github.com/heroui-inc/vite-template.git
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the web development server

```bash
npm run dev
```

### Run the Tauri desktop app (development)

This will start the Vite dev server and launch the Tauri shell:

```bash
npm run tauri dev
```

### Build the Tauri desktop app (production)

Generates platform-specific bundles (e.g., `.msi`, `.dmg`, `.AppImage`, etc.):

```bash
npm run tauri build
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## Available Scripts

- `dev`: run Vite dev server for the web app
- `build`: build the web assets
- `preview`: preview the built web app
- `tauri dev`: run the Tauri desktop app in development
- `tauri build`: build the Tauri production bundles

Note: Exact script names may vary depending on your package manager configuration.

## Project Structure

Common relevant files and directories:

- `src/`: React application source code
  - `components/`: UI components (e.g., `Navbar.tsx`, `primitives.ts`, `icons.tsx`)
  - `store/`: state management setup (e.g., `store/index.ts`)
  - `provider.tsx`: app-level providers
  - `main.tsx`, `App.tsx`: app bootstrap and root component
- `vite.config.ts`: Vite configuration
- `tauri/`: Tauri Rust side configuration and sources (appears after initializing Tauri)

If `tauri/` is not present, initialize Tauri with:

```bash
npm create tauri-app@latest
```

Then choose “use existing frontend” and point it to this Vite app.

## Troubleshooting

- If Tauri build fails on Windows, ensure:
  - WebView2 Runtime is installed
  - Visual Studio Build Tools with C++ workload are installed
- If Tailwind classes don’t apply, ensure the Tailwind config `content` includes your `src/**` files and HeroUI’s paths if required.
- For dependency hoisting issues with `pnpm`, verify `.npmrc` contains the `public-hoist-pattern` above.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/vite-template/blob/main/LICENSE).
