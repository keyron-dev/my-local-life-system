import { hashContent, hasFileChanged, saveFileHash, processFileIfChanged } from '../src/sync/watcher'
import { openDatabaseAsync } from 'expo-sqlite'
import { DB } from '../src/database/db'

const mockOpenDatabase = openDatabaseAsync as jest.MockedFunction<typeof openDatabaseAsync>

jest.mock('../src/sync/sync', () => ({
  indexFile: jest.fn().mockResolvedValue(undefined),
}))

import { indexFile } from '../src/sync/sync'

describe('watcher', () => {
  let db: DB
  let mockDb: {
    execAsync: jest.Mock
    runAsync: jest.Mock
    getFirstAsync: jest.Mock
    getAllAsync: jest.Mock
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    db = await mockOpenDatabase('tasks.db') as unknown as DB
    mockDb = await mockOpenDatabase.mock.results[mockOpenDatabase.mock.results.length - 1].value
  })

  describe('hashContent', () => {
    it('возвращает строку', () => {
      expect(typeof hashContent('hello')).toBe('string')
    })

    it('одинаковый контент → одинаковый hash', () => {
      expect(hashContent('abc')).toBe(hashContent('abc'))
    })

    it('разный контент → разный hash', () => {
      expect(hashContent('abc')).not.toBe(hashContent('xyz'))
    })
  })

  describe('hasFileChanged', () => {
    it('возвращает true если записи нет в config', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)
      const result = await hasFileChanged(db, 'inbox.md', 'abc123')
      expect(result).toBe(true)
    })

    it('возвращает false если hash совпадает', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ value: 'abc123' })
      const result = await hasFileChanged(db, 'inbox.md', 'abc123')
      expect(result).toBe(false)
    })

    it('возвращает true если hash отличается', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ value: 'oldHash' })
      const result = await hasFileChanged(db, 'inbox.md', 'newHash')
      expect(result).toBe(true)
    })
  })

  describe('processFileIfChanged', () => {
    it('возвращает false если hash не изменился', async () => {
      const content = '- [ ] Задача'
      const hash = hashContent(content)
      mockDb.getFirstAsync.mockResolvedValueOnce({ value: hash })

      const result = await processFileIfChanged(db, 'inbox.md', content)
      expect(result).toBe(false)
      expect(indexFile).not.toHaveBeenCalled()
    })

    it('возвращает true и вызывает indexFile если файл изменился', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      const result = await processFileIfChanged(db, 'inbox.md', '- [ ] Новая задача')
      expect(result).toBe(true)
      expect(indexFile).toHaveBeenCalled()
    })

    it('сохраняет новый hash после индексации', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      await processFileIfChanged(db, 'inbox.md', '- [ ] Задача')
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining(['hash_inbox.md']),
      )
    })
  })
})
