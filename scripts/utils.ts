import { GlobOptionsWithoutFileTypes } from 'node:fs';
import { glob, mkdir, rename, access, rm } from 'node:fs/promises';
import { join, normalize, isAbsolute, relative, dirname } from 'node:path';
import { x } from 'tinyexec'
import type { Options as TinyexecOptions } from 'tinyexec'

export function createStaging(pattern: string | string[], options: GlobOptionsWithoutFileTypes = {}) {
  const cwd = process.cwd();
  const temp = join(cwd, '.stag');
  let backup: { original: string; cache: string }[] = [];
  async function kill() {
    console.log('[staging-area] Stopping store operation.');
    await restore()
    process.exit(0);
  }

  async function store() {
    const entries = glob(pattern, { ...options, cwd });

    process.on('SIGINT', kill)

    for await (const entry of entries) {
      const entryPath = entry.toString();
      const original = normalize(isAbsolute(entryPath) ? entryPath : join(cwd, entryPath));

      try {
        await access(original);
        const relPath = relative(cwd, original);
        const cache = join(temp, relPath);
        await mkdir(dirname(cache), { recursive: true });
        await rename(original, cache);
        backup.push({ original, cache });
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
        console.warn(`[staging-area] Skipped non-existent file: ${original}`);
      }
    }
    if (backup.length > 0)
      console.log(`[staging-area] Staged ${backup.length} files.`);
  }

  async function restore() {
    if (backup.length === 0) return;

    for (const { original, cache } of backup) {
      try {
        await mkdir(dirname(original), { recursive: true });
        await rename(cache, original);
      } catch (error) {
        console.error(`[staging-area] Restore failed: ${original}`, error);
      }
    }

    await rm(temp, { recursive: true, force: true });
    process.off('SIGINT', kill)
    backup = [];
    console.log('[staging-area] Restored and cleaned up cache.');
  }

  return { store, restore };
}

export async function exec(command: string, args?: string[], env?: Record<string, string>) {
  const options: Partial<TinyexecOptions> = {
    nodeOptions: { stdio: 'inherit', env: { ...process.env, ...env } }
  }
  await x(command, args, options)
}