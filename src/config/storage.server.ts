import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

export const storageServer = createStorage({
  driver: fsDriver({ base: '.data' }),
})
