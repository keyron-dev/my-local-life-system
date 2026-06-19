import { getConfig, setConfig, getTaskFilePath, isFeatureEnabled } from '../src/core/config'

function makeDb(rows: { key: string; value: string }[] = []) {
  return {
    getAllAsync: jest.fn().mockResolvedValue(rows),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    execAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  }
}

describe('getConfig', () => {
  it('returns defaults when config table is empty', async () => {
    const db = makeDb([])
    const config = await getConfig(db as any)
    expect(config).toEqual({
      vaultPath: '/storage/emulated/0/MyTasks',
      userLevel: 'simple',
      enabledFeatures: [],
      taskFilesDir: '/storage/emulated/0/MyTasks/tasks',
    })
  })

  it('returns stored values over defaults', async () => {
    const db = makeDb([
      { key: 'vaultPath', value: '/custom/path' },
      { key: 'userLevel', value: 'gtd' },
      { key: 'enabledFeatures', value: '["voice","sync"]' },
      { key: 'taskFilesDir', value: '/custom/path/tasks' },
    ])
    const config = await getConfig(db as any)
    expect(config.vaultPath).toBe('/custom/path')
    expect(config.userLevel).toBe('gtd')
    expect(config.enabledFeatures).toEqual(['voice', 'sync'])
    expect(config.taskFilesDir).toBe('/custom/path/tasks')
  })
})

describe('setConfig', () => {
  it('calls runAsync with correct SQL and string value', async () => {
    const db = makeDb()
    await setConfig(db as any, 'vaultPath', '/new/path')
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO config'),
      ['vaultPath', '/new/path'],
    )
  })

  it('serializes array values via JSON.stringify', async () => {
    const db = makeDb()
    await setConfig(db as any, 'enabledFeatures', ['voice', 'sync'])
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO config'),
      ['enabledFeatures', '["voice","sync"]'],
    )
  })
})

describe('getTaskFilePath', () => {
  it('joins taskFilesDir and fileName', async () => {
    const db = makeDb([{ key: 'taskFilesDir', value: '/custom/tasks' }])
    const path = await getTaskFilePath(db as any, 'inbox.md')
    expect(path).toBe('/custom/tasks/inbox.md')
  })

  it('uses default taskFilesDir when not set', async () => {
    const db = makeDb([])
    const path = await getTaskFilePath(db as any, 'backlog.md')
    expect(path).toBe('/storage/emulated/0/MyTasks/tasks/backlog.md')
  })
})

describe('isFeatureEnabled', () => {
  it('returns false for non-existent feature', async () => {
    const db = makeDb([])
    expect(await isFeatureEnabled(db as any, 'voice')).toBe(false)
  })

  it('returns true when feature is in enabledFeatures', async () => {
    const db = makeDb([{ key: 'enabledFeatures', value: '["voice","sync"]' }])
    expect(await isFeatureEnabled(db as any, 'voice')).toBe(true)
  })

  it('returns false when feature is not in enabledFeatures', async () => {
    const db = makeDb([{ key: 'enabledFeatures', value: '["sync"]' }])
    expect(await isFeatureEnabled(db as any, 'voice')).toBe(false)
  })
})
