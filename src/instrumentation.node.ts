if (!await storageServer.has('config.json')) {
  const value = await storageServer.get('config.default.json')
  await storageServer.setItem('config.json', value)
}

export {}
