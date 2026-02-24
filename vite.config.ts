import type { PluginOption } from 'vite'
import path from 'node:path'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import autoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'
import tsconfigPaths from 'vite-tsconfig-paths'

const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
export default defineConfig(async () => ({
  // 明确从项目根加载 .env，避免从子目录执行 tauri build 时读不到
  envDir: path.resolve(__dirname),
  plugins: [
    react(),
    autoImport({
      dts: 'src/types/auto-imports.d.ts',
      imports: [
        'react',
        'react-router-dom',
      ],
      dirs: [
        'src/database',
        'src/config',
        'src/components',
        'src/layouts/index.ts',
        'src/services',
        'src/store/index.ts',
        'src/utils',
        'src/hooks',
        'src/apis',
      ],
    }),
    Pages(),
    tsconfigPaths({
      skip: dir => dir === 'sources',
    }),
    tailwindcss() as unknown as PluginOption,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}))
