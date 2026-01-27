import { defineConfig } from 'bumpp'

export default defineConfig({
  release: 'prompt',
  commit: true,
  push: false,
  tag: false,
  files: [
    'package.json',
    'tauri/Cargo.toml',
    'tauri/Cargo.lock',
    'tauri/tauri.conf.json',
  ],
})
