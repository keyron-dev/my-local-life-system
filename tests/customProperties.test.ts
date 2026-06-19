import {
  createCustomProperty,
  getCustomProperties,
  archiveCustomProperty,
  deleteCustomProperty,
  CustomProperty,
} from '../src/core/customProperties'
import { DB } from '../src/database/db'

function makeDb(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    execAsync: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as DB
}

const PROP: CustomProperty = { key: 'effort', displayName: 'Effort', type: 'number' }

describe('createCustomProperty', () => {
  it('вызывает INSERT OR REPLACE с правильными параметрами', async () => {
    const db = makeDb()
    await createCustomProperty(db, PROP)
    expect((db.runAsync as jest.Mock)).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO custom_properties'),
      ['effort', 'Effort', 'number'],
    )
  })
})

describe('getCustomProperties', () => {
  it('возвращает пустой массив если таблица пустая', async () => {
    const db = makeDb()
    expect(await getCustomProperties(db)).toEqual([])
  })

  it('маппит display_name → displayName', async () => {
    const db = makeDb({
      getAllAsync: jest.fn().mockResolvedValue([
        { key: 'effort', display_name: 'Effort', type: 'number' },
      ]),
    })
    const result = await getCustomProperties(db)
    expect(result[0].displayName).toBe('Effort')
    expect(result[0].key).toBe('effort')
    expect(result[0].type).toBe('number')
  })
})

describe('archiveCustomProperty', () => {
  it('добавляет префикс [archived] если его нет', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({ display_name: 'Effort' }),
    })
    await archiveCustomProperty(db, 'effort')
    expect((db.runAsync as jest.Mock)).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE custom_properties'),
      ['[archived] Effort', 'effort'],
    )
  })

  it('не обновляет если префикс уже есть', async () => {
    const db = makeDb({
      getFirstAsync: jest.fn().mockResolvedValue({ display_name: '[archived] Effort' }),
    })
    await archiveCustomProperty(db, 'effort')
    expect((db.runAsync as jest.Mock)).not.toHaveBeenCalled()
  })

  it('ничего не делает если свойство не найдено', async () => {
    const db = makeDb({ getFirstAsync: jest.fn().mockResolvedValue(null) })
    await archiveCustomProperty(db, 'nonexistent')
    expect((db.runAsync as jest.Mock)).not.toHaveBeenCalled()
  })
})

describe('deleteCustomProperty', () => {
  it('вызывает DELETE с правильным key', async () => {
    const db = makeDb()
    await deleteCustomProperty(db, 'effort')
    expect((db.runAsync as jest.Mock)).toHaveBeenCalledWith(
      'DELETE FROM custom_properties WHERE key = ?',
      ['effort'],
    )
  })
})
