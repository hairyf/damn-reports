/* eslint-disable no-new-func */
import { resolveResource } from '@tauri-apps/api/path'
import { Command } from '@tauri-apps/plugin-shell'
import mustache from 'mustache'

// Disable Mustache's default HTML escaping — all templates here are for
// command-line arguments and URLs, not HTML content.
// Without this, paths like "D:/projects" become "D:&#x2F;projects".
mustache.escape = (text: string) => text

/** Escape path for use inside single-quoted shell string */
function escapeForShellQuoted(path: string, isWindows: boolean): string {
  return isWindows
    ? path.replace(/'/g, '\'\'') // PowerShell: '' = escaped '
    : path.replace(/'/g, '\'\\\'\'') // sh: '\'' = embed single quote
}

function evaluateJavaScriptExpression<T>(expression: string, data: any): T {
  const runner = new Function('$data', `return (${expression})`)
  return runner(data) as T
}

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
    // Strings starting with "$" are evaluated as JavaScript expressions.
    // The current config object is bound to $data.
    if (value.trim().startsWith('$')) {
      try {
        return evaluateJavaScriptExpression(value, config)
      }
      catch {
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
  switch (collector.type) {
    case 'exec':
      return executeCommandExpression(collector, config)
    case 'http':
      return executeHttpRequestExpression(collector, config)
    default:
      throw new Error(
        `Unknown collector type "${collector.type}". Expected "exec" or "http".`,
      )
  }
}

export async function executeCommandExpression(collector: Collector, config: Record<string, any>) {
  const { command, args = [] } = collector.executor

  // Render command and args (supports mustache + JavaScript expressions, consistent with HTTP)
  const renderedCommand = await renderTemplate(command, config) as string
  const renderedArgs = (await Promise.all((args as string[]).map(arg => renderTemplate(arg, config)))) as string[]

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
        return evaluateJavaScriptExpression(collector.transformer, result) || []
      }
      catch (transformError) {
        const errMsg = transformError instanceof Error ? transformError.message : String(transformError)
        throw new Error(
          [
            `Transformer failed for command "${renderedCommand}".`,
            `Transformer expression: ${collector.transformer}`,
            `Raw output (first 500 chars): ${String(result).slice(0, 500)}`,
            `Error: ${errMsg}`,
          ].join('\n'),
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
    throw new Error(`exec_tool failed for command: ${fullCommand}\nError: ${errMsg}`)
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

  const requestHeaders: Record<string, string> = { ...headers }
  if (body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const options: RequestInit = {
    method,
    headers: requestHeaders,
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  try {
    const response = await fetch(url.toString(), options)

    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (collector.transformer) {
      return evaluateJavaScriptExpression(collector.transformer, result)
    }

    return result
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`HTTP request failed: ${msg}`)
  }
}

export async function executeCommand(command: string) {
  const cwd = await resolveResource('workspace')
  const isWindows = navigator.userAgent.toLowerCase().includes('windows')
  const safeCwd = escapeForShellQuoted(cwd, isWindows)
  const shellCommand = isWindows
    ? [
        'chcp 65001 | Out-Null',
        '$OutputEncoding = [System.Text.Encoding]::UTF8',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
        '[Console]::InputEncoding = [System.Text.Encoding]::UTF8',
        `Set-Location '${safeCwd}'`,
        command,
      ].join('; ')
    : `cd '${safeCwd}' && ${command}`

  const cmd = isWindows
    ? Command.create('powershell', ['-Command', shellCommand])
    : Command.create('sh', ['-c', shellCommand])

  const output = await cmd.execute()

  if (output.code !== 0) {
    const stderrPart = output.stderr ? `stderr: ${output.stderr}\n` : ''
    const stdoutPart = output.stdout ? `stdout: ${output.stdout}` : ''
    throw new Error(
      [
        `Command failed (exit code ${output.code})`,
        `Command: ${command}`,
        `Working directory: ${cwd}`,
        stderrPart,
        stdoutPart,
      ].filter(Boolean).join('\n'),
    )
  }

  return output.stdout
}
