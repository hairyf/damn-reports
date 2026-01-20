# 📊 Damn Reports

A modern desktop application that automatically collects daily activities from multiple sources (ClickUp, Git, etc.) and generates beautiful daily reports powered by AI.

![Home](static/home.png)

![Workflow](static/workflow.png)

## Features

- 🤖 **AI-Powered Report Generation** - Automatically generates professional daily reports using DeepSeek AI via n8n workflows
- 📥 **Multiple Data Sources** - Collects activities from ClickUp tasks, Git commits, and more
- ⏰ **Scheduled Collection** - Automatically collects data on a schedule without manual intervention
- 🎨 **Modern UI** - Built with HeroUI v2, Tailwind CSS, and Framer Motion for a delightful experience
- 💾 **Local Database** - All data stored locally using SQLite with Prisma ORM
- 🔄 **Workflow Integration** - Seamless integration with n8n for customizable report generation workflows
- 🪟 **System Tray** - Runs in the background with system tray support
- ⚡ **Fast & Lightweight** - Built with Tauri for native performance and small bundle size

## Usage

### Getting Started

1. **Configure Data Sources**
   - Add ClickUp source with your API token, team ID, and user ID
   - Add Git source with repository URL, branch, and author name
   - Enable/disable sources as needed

2. **Setup n8n Workflow**
   - Configure n8n integration (automatically started with the app)
   - Set up DeepSeek API key for AI-powered report generation
   - Customize the report generation workflow as needed

3. **Generate Reports**
   - Click "Generate" to manually trigger report generation
   - Or wait for scheduled automatic collection and generation

4. **View & Edit Reports**
   - Browse generated reports in the Reports page
   - Edit report content using the built-in rich text editor
   - View collection statistics and trends

### Configuration

No environment variables required. All configurations are stored in the local database and app settings.

## Development

### Prerequisites

- **Node.js** 20.19+ and a package manager (`pnpm` recommended)
- **Rust** toolchain (stable) installed via [rustup](https://rustup.rs)
- **Tauri prerequisites**:
  - **Windows**: Visual Studio Build Tools with Desktop development with C++, WebView2
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Required system libraries (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))

### Quick Start

#### Install dependencies

```bash
pnpm install
```

#### Run in development

```bash
# Start the web development server
pnpm dev

# Or run the Tauri desktop app
pnpm tauri dev
```

#### Build for production

```bash
pnpm tauri build
```

This will generate platform-specific installers (`.msi` for Windows, `.dmg` for macOS, `.AppImage` for Linux).

### pnpm Configuration

If you're using `pnpm`, add this to your `.npmrc` file:

```ini
public-hoist-pattern[]=*@heroui/*
```

Then run `pnpm install` again.

### Available Scripts

- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build web assets
- `pnpm preview` - Preview built web app
- `pnpm tauri dev` - Run Tauri app in development
- `pnpm tauri build` - Build Tauri production bundles
- `pnpm lint` - Run ESLint
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations

### Project Structure

```
.
├── src/                    # React frontend source
│   ├── components/         # UI components
│   ├── pages/              # Application pages
│   ├── services/           # API service functions
│   ├── store/              # State management
│   ├── database/           # Database models (generated from Prisma)
│   └── config/             # Configuration files
├── tauri/                  # Tauri Rust backend
│   ├── src/
│   │   ├── collector/      # Data collection logic (ClickUp, Git)
│   │   ├── n8n/            # n8n integration
│   │   ├── schedule/       # Scheduled task management
│   │   ├── task/           # Background tasks
│   │   ├── axum/           # Internal API server
│   │   └── database/       # Database connection and entities
│   └── prisma/             # Database schema and migrations
└── sidecar-app/            # n8n process sidecar
```

### Technologies

- **Frontend**: React 19, TypeScript, Vite
- **UI**: HeroUI v2, Tailwind CSS, Framer Motion
- **Backend**: Rust, Tauri
- **Database**: SQLite with Prisma ORM
- **Workflow**: n8n (embedded)
- **AI**: DeepSeek API
- **State**: Valtio, TanStack Query
- **Forms**: React Hook Form, Zod

### Troubleshooting

#### Tauri Build Issues

**Windows**:

- Ensure WebView2 Runtime is installed
- Install Visual Studio Build Tools with C++ workload

**macOS**:

- Ensure Xcode Command Line Tools are installed: `xcode-select --install`

**Linux**:

- See [Tauri prerequisites](https://tauri.app/start/prerequisites/) for required system libraries

#### Database Issues

If you encounter database errors:

- Run `pnpm prisma:migrate` to apply migrations
- Run `pnpm prisma:generate` to regenerate the Prisma client

#### n8n Not Starting

- Check that port 5678 is not already in use
- Ensure the n8n process has proper permissions
- Check console logs for error messages

## License

MIT License © 2024
