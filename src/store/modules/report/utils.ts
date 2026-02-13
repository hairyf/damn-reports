import { MAX_DATA_SIZE } from './types'

export function stringifyData(data: unknown): string | undefined {
  if (!data)
    return undefined
  const json = typeof data === 'string' ? data : JSON.stringify(data)
  if (json.length > MAX_DATA_SIZE)
    return `${json.slice(0, MAX_DATA_SIZE)}...`
  return json
}
