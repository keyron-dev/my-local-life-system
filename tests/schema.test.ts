import {
  CREATE_TASKS_TABLE,
  CREATE_FILTERS_TABLE,
  CREATE_CUSTOM_PROPS_TABLE,
  CREATE_CONFIG_TABLE,
  CREATE_INDEXES,
} from '../src/database/schema'

describe('schema', () => {
  describe('CREATE_TASKS_TABLE', () => {
    const REQUIRED_COLUMNS = [
      'id', 'title', 'status', 'type', 'priority',
      'created', 'due', 'tags', 'raw', 'file_path',
    ]

    it('содержит CREATE TABLE IF NOT EXISTS', () => {
      expect(CREATE_TASKS_TABLE).toContain('CREATE TABLE IF NOT EXISTS')
    })

    for (const col of REQUIRED_COLUMNS) {
      it(`содержит колонку "${col}"`, () => {
        expect(CREATE_TASKS_TABLE).toContain(col)
      })
    }
  })

  describe('CREATE_FILTERS_TABLE', () => {
    it('содержит CREATE TABLE IF NOT EXISTS', () => {
      expect(CREATE_FILTERS_TABLE).toContain('CREATE TABLE IF NOT EXISTS')
    })
  })

  describe('CREATE_CUSTOM_PROPS_TABLE', () => {
    it('содержит CREATE TABLE IF NOT EXISTS', () => {
      expect(CREATE_CUSTOM_PROPS_TABLE).toContain('CREATE TABLE IF NOT EXISTS')
    })
  })

  describe('CREATE_CONFIG_TABLE', () => {
    it('содержит CREATE TABLE IF NOT EXISTS', () => {
      expect(CREATE_CONFIG_TABLE).toContain('CREATE TABLE IF NOT EXISTS')
    })
  })

  describe('CREATE_INDEXES', () => {
    it('массив из 4 элементов', () => {
      expect(CREATE_INDEXES).toHaveLength(4)
    })

    it('каждый индекс содержит CREATE INDEX IF NOT EXISTS', () => {
      for (const idx of CREATE_INDEXES) {
        expect(idx).toContain('CREATE INDEX IF NOT EXISTS')
      }
    })

    it('покрывает колонки type, status, due, priority', () => {
      const all = CREATE_INDEXES.join(' ')
      expect(all).toContain('tasks(type)')
      expect(all).toContain('tasks(status)')
      expect(all).toContain('tasks(due)')
      expect(all).toContain('tasks(priority)')
    })
  })
})
