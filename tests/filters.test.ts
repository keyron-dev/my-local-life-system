import { saveFilter, getFilters, deleteFilter, SavedFilter } from '../src/core/filters'
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

const FILTER: SavedFilter = {
  id: 'f1',
  name: 'Срочные',
  conditions: { status: ['active'], priority: [3], tags: ['work'] },
}

describe('saveFilter', () => {
  it('сериализует conditions через JSON.stringify', async () => {
    const db = makeDb()
    await saveFilter(db, FILTER)
    const call = (db.runAsync as jest.Mock).mock.calls[0]
    expect(call[1][2]).toBe(JSON.stringify(FILTER.conditions))
  })

  it('передаёт id и name', async () => {
    const db = makeDb()
    await saveFilter(db, FILTER)
    const call = (db.runAsync as jest.Mock).mock.calls[0]
    expect(call[1][0]).toBe('f1')
    expect(call[1][1]).toBe('Срочные')
  })
})

describe('getFilters', () => {
  it('возвращает пустой массив если фильтров нет', async () => {
    const db = makeDb()
    expect(await getFilters(db)).toEqual([])
  })

  it('парсит conditions через JSON.parse', async () => {
    const db = makeDb({
      getAllAsync: jest.fn().mockResolvedValue([
        { id: 'f1', name: 'Срочные', conditions: JSON.stringify(FILTER.conditions) },
      ]),
    })
    const result = await getFilters(db)
    expect(result[0].conditions).toEqual(FILTER.conditions)
    expect(result[0].id).toBe('f1')
    expect(result[0].name).toBe('Срочные')
  })
})

describe('deleteFilter', () => {
  it('вызывает DELETE с правильным id', async () => {
    const db = makeDb()
    await deleteFilter(db, 'f1')
    expect((db.runAsync as jest.Mock)).toHaveBeenCalledWith(
      'DELETE FROM filters WHERE id = ?',
      ['f1'],
    )
  })
})
