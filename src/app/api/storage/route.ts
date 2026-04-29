import { storageServer } from '@/config/storage.server'

export interface StorageRequestBody {
  method: string
  params: any[]
}
export async function POST(req: Request) {
  const { method, params = [] } = await req.json()
  return Response.json((storageServer as any)[method](...params))
}
