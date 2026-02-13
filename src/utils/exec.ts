import { resolveResource } from '@tauri-apps/api/path'
import { Command } from '@tauri-apps/plugin-shell'
import jsonata from 'jsonata'
import mustache from 'mustache'

// Disable Mustache's default HTML escaping — all templates here are for
// command-line arguments and URLs, not HTML content.
// Without this, paths like "D:/projects" become "D:&#x2F;projects".
mustache.escape = (text: string) => text

export interface Collector {
  name: string
  description: string
  files?: string[]
  type: 'exec' | 'http'
  executor: Record<string, any>
  definition?: Record<string, {
    type: string
    description: string
    optional?: boolean
    default?: string | number | boolean
  }>
  transformer?: string
}

async function renderTemplate(value: any, config: Record<string, any>): Promise<any> {
  if (typeof value === 'string') {
    // Check if it's a jsonata expression (starts with $)
    if (value.trim().startsWith('$')) {
      try {
        const expression = jsonata(value)
        return await expression.evaluate(config)
      }
      catch {
        // If jsonata fails, fall back to mustache
        return mustache.render(value, config)
      }
    }
    return mustache.render(value, config)
  }
  if (Array.isArray(value)) {
    return await Promise.all(value.map(item => renderTemplate(item, config)))
  }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = await renderTemplate(val, config)
    }
    return result
  }
  return value
}

export function executeCollector(collector: Collector, config: Record<string, any>) {
  if (collector.type === 'exec') {
    return executeCommandExpression(collector, config)
  }
  else if (collector.type === 'http') {
    return executeHttpRequestExpression(collector, config)
  }
}

export async function executeCommandExpression(collector: Collector, config: Record<string, any>) {
  const { command, args = [] } = collector.executor

  // Render command and args with mustache templates
  const renderedCommand = mustache.render(command, config)
  const renderedArgs = args.map((arg: string) => mustache.render(String(arg), config))

  // Properly quote arguments that contain spaces or special characters
  const quotedArgs = renderedArgs.map((arg: string) => {
    if (/[\s"'`$\\!&|;(){}]/.test(arg) && !arg.startsWith('"') && !arg.startsWith('\''))
      return `"${arg.replace(/"/g, '\\"')}"`
    return arg
  })

  // Build full command string for executeCommand
  const fullCommand = [renderedCommand, ...quotedArgs].join(' ')

  try {
    const result = await executeCommand(fullCommand)

    // Apply transformer if provided
    if (collector.transformer) {
      try {
        const expression = jsonata(collector.transformer)
        return await expression.evaluate(result)
      }
      catch (transformError) {
        const errMsg = transformError instanceof Error ? transformError.message : String(transformError)
        throw new Error(
          `Transformer failed for command "${renderedCommand}".\n`
          + `Transformer expression: ${collector.transformer}\n`
          + `Raw output (first 500 chars): ${String(result).slice(0, 500)}\n`
          + `Error: ${errMsg}`,
        )
      }
    }

    return result
  }
  catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    // Re-throw with enriched context if not already enriched
    if (errMsg.includes('Transformer failed'))
      throw error
    throw new Error(
      `exec_tool failed for command: ${fullCommand}\n`
      + `Error: ${errMsg}`,
    )
  }
}

export async function executeHttpRequestExpression(collector: Collector, config: Record<string, any>) {
  // Render executor with template recursively
  const rendered = await renderTemplate(collector.executor, config)
  const { baseUrl, method = 'GET', path, headers = {}, query = {}, body } = rendered

  // Build URL with query parameters
  const url = new URL(path, baseUrl)
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.append(key, String(value))
  }

  try {
    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
    }

    const response = await fetch(url.toString(), options)

    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    // Apply transformer if provided
    if (collector.transformer) {
      const expression = jsonata(collector.transformer)
      return await expression.evaluate(result)
    }

    return result
  }
  catch (error) {
    console.error('HTTP request error:', error)
    throw error
  }
}

export async function executeCommand(command: string) {
  try {
    // Get app data directory as working directory
    const cwd = await resolveResource('workspace')

    // Detect platform and use appropriate shell
    const isWindows = navigator.userAgent.toLowerCase().includes('windows')

    let cmd: any
    if (isWindows) {
      // Use PowerShell on Windows with comprehensive UTF-8 support
      // - $OutputEncoding: affects encoding for piped output to native commands
      // - [Console]::OutputEncoding: affects how PowerShell reads native command stdout
      // - chcp 65001: sets the console code page to UTF-8 for child processes
      const psCommand = [
        'chcp 65001 | Out-Null',
        '$OutputEncoding = [System.Text.Encoding]::UTF8',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
        '[Console]::InputEncoding = [System.Text.Encoding]::UTF8',
        `Set-Location '${cwd}'`,
        command,
      ].join('; ')
      cmd = Command.create('powershell', ['-Command', psCommand])
    }
    else {
      // Use sh on Unix-like systems with cd to working directory
      cmd = Command.create('sh', ['-c', `cd '${cwd}' && ${command}`])
    }

    const output = await cmd.execute()

    if (output.code !== 0) {
      throw new Error(
        `Command failed (exit code ${output.code})\n`
        + `Command: ${command}\n`
        + `Working directory: ${cwd}\n${
          output.stderr ? `stderr: ${output.stderr}\n` : ''
        }${output.stdout ? `stdout: ${output.stdout}` : ''}`,
      )
    }

    return output.stdout
  }
  catch (error) {
    console.error(error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Command execution error: ${errorMessage}`)
  }
}
