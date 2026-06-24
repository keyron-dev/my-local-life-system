import {
  getAttachmentsPath,
  saveAttachment,
  getTaskAttachments,
  deleteAttachment,
} from '../src/sync/attachments'
import * as FileSystem from 'expo-file-system'
import { DB } from '../src/database/db'

function makeDb(overrides: Partial<DB> = {}): DB {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as DB
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAttachmentsPath', () => {
  it('возвращает правильный путь', () => {
    expect(getAttachmentsPath('/vault')).toBe('/vault/attachments')
  })
})

describe('saveAttachment', () => {
  it('вызывает runAsync с INSERT', async () => {
    const db = makeDb()
    const attachId = await saveAttachment(db, 'task1', '/tmp/photo.jpg', '/vault')

    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: '/tmp/photo.jpg',
      to: expect.stringContaining('/vault/attachments/'),
    })

    const runCalls = (db.runAsync as jest.Mock).mock.calls
    const insertCall = runCalls.find((c: unknown[]) =>
      typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO attachments'),
    )
    expect(insertCall).toBeDefined()
    expect(insertCall[1]).toContain('task1')
    expect(typeof attachId).toBe('string')
    expect(attachId.length).toBeGreaterThan(0)
  })
})

describe('getTaskAttachments', () => {
  it('вызывает getAllAsync с task_id', async () => {
    const db = makeDb()
    await getTaskAttachments(db, 'task1')

    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE task_id = ?'),
      ['task1'],
    )
  })

  it('маппит поля из snake_case', async () => {
    const db = makeDb({
      getAllAsync: jest.fn().mockResolvedValue([
        { id: 'A1', file_path: '/p', file_name: 'f.jpg', file_type: 'jpg' },
      ]) as DB['getAllAsync'],
    })
    const result = await getTaskAttachments(db, 'task1')
    expect(result[0]).toEqual({ id: 'A1', filePath: '/p', fileName: 'f.jpg', fileType: 'jpg' })
  })
})

describe('deleteAttachment', () => {
  it('вызывает deleteAsync и runAsync с DELETE', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({ file_path: '/vault/attachments/f.jpg' }) as DB['getFirstAsync'],
    })
    await deleteAttachment(db, 'A1')

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('/vault/attachments/f.jpg', { idempotent: true })

    const runCalls = (db.runAsync as jest.Mock).mock.calls
    const deleteCall = runCalls.find((c: unknown[]) =>
      typeof c[0] === 'string' && (c[0] as string).includes('DELETE FROM attachments'),
    )
    expect(deleteCall).toBeDefined()
  })

  it('не вызывает deleteAsync если запись не найдена', async () => {
    const db = makeDb()
    await deleteAttachment(db, 'MISSING')
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled()
  })
})
