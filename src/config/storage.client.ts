import { createStorage } from 'unstorage'
import { nextFsClientDriver } from '../utils/driver'

export const storageClient = createStorage({
  driver: nextFsClientDriver({}),
})
