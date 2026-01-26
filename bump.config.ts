import { defineConfig } from 'bumpp'

export default defineConfig({
  release: 'prompt',
  files: [
    'package.json',
    'tauri/Cargo.toml',
    'tauri/tauri.conf.json',
  ],
})
