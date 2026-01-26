import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'bumpp'

export default defineConfig({
  release: 'prompt',
  files: [
    'package.json',
    'tauri/Cargo.toml',
    'tauri/tauri.conf.json',
  ],
  execute: ({ state, options }) => {
    const { currentVersion, newVersion } = state
    const tauriDir = join(options.cwd, 'tauri')
    const lockPath = join(tauriDir, 'Cargo.lock')

    const tomlContent = readFileSync(join(tauriDir, 'Cargo.toml'), 'utf-8')
    const packageName = tomlContent.match(/^name\s*=\s*"([^"]+)"/m)?.[1]
    const lockContent = readFileSync(lockPath, 'utf-8')
    const targetSection = `name = "${packageName}"`
    const versionPattern = new RegExp(`(${targetSection}[^]*?version = ")${currentVersion}"`)

    if (versionPattern.test(lockContent)) {
      const updated = lockContent.replace(versionPattern, `$1${newVersion}"`)
      writeFileSync(lockPath, updated)
    }
  },
})
