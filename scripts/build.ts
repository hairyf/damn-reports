import { createStaging, exec } from "./utils"
import fs from 'fs-extra'

async function main() {
  await fs.remove('.next')
  await fs.remove('dist')

  await buildNextServer()
  await buildNextClient()
}

main()

async function buildNextServer() {
  const staging = createStaging([
    'src/app/**/layout.tsx',
    'src/app/**/page.tsx',
    'public/**/*'
  ])

  await staging.store()

  const output = 'src-tauri/binaries/next'

  const platform = [
    { target: 'bun-windows-x64', suffix: 'x86_64-pc-windows-msvc' },
    { target: 'bun-darwin-x64', suffix: 'x86_64-apple-darwin' },
    { target: 'bun-linux-x64', suffix: 'x86_64-unknown-linux-gnu' },
  ]

  const commands = platform.map(p => ({
    command: 'next-bun-compile',
    args: ['--target', p.target, '--outfile', `${output}-${p.suffix}`]
  }))

  try {
    await exec('bun', ['next', 'build'], { ONLY_SERVER: '1' })
    await fs.copy('.next/standalone', 'dist/server')
    for (const cmd of commands)
      await exec(cmd.command, cmd.args)
  } finally {
    await staging.restore()
  }
}

async function buildNextClient() {
  const staging = createStaging('src/app/api/**/*')

  await staging.store()
  try {
    await exec('bun', ['next', 'build'], { ONLY_CLIENT: '1' })
    await fs.move('out', 'dist/client')
  } finally {
    await staging.restore()
  }
}
