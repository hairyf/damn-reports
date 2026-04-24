import type { PluginOption } from 'vite'
import path from 'node:path'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import autoImport from 'unplugin-auto-import/vite'
import { vitePluginAppRouter as appRouter } from "vite-plugin-app-router";
import { defineConfig } from 'vite'

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
        {
          from: 'clsx',
          imports: ['clsx']
        },
        {from: 'react-if-lite', imports: ['If', 'Else', 'Then']}
      ],
      dirs: [
        'src/database',
        'src/config',
        'src/components',
        'src/layout/index.ts',
        'src/services',
        'src/store/index.ts',
        'src/utils',
        'src/hooks',
        'src/apis',
      ],
    }),
    appRouter(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
