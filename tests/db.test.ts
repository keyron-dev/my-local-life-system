import { initDatabase, saveTask, getTaskById, getAllTasks, getTasksByType, getOverdueTasks, DB } from '../src/database/db'
import { openDatabaseAsync } from 'expo-sqlite'
import { Task } from '../src/types/task'

const mockOpenDatabase = openDatabaseAsync as jest.MockedFunction<typeof openDatabaseAsync>

const SAMPLE_TASK: Task = {
  id:          'aB3cD',
  title:       'Тестовая задача',
  status:      'active',
  type:        'todo',
  priority:    2,
  indentLevel: 0,
  created:     '2025-01-10',
  event:       null,
  start:       null,
  due:         '2025-06-30',
  done:        null,
  remind:      ['2025-06-29T09:00'],
  tags:        ['работа', 'тест'],
  links:       [],
  from:        [],
  parent:      null,
  repeat:      null,
  desc:        'Описание задачи',
  raw:         '- [ ] Тестовая задача [t::todo] [id::aB3cD]',
  customProps: { energy: 'high' },
}

describe('db', () => {
  let db: DB

  beforeEach(async () => {
    jest.clearAllMocks()
    db = await initDatabase()
  })

  describe('initDatabase', () => {
    it('вызывает openDatabaseAsync с именем tasks.db', async () => {
      expect(mockOpenDatabase).toHaveBeenCalledWith('tasks.db')
    })

    it('вызывает execAsync хотя бы раз (создание таблиц)', async () => {
      const mockDb = await mockOpenDatabase.mock.results[0].value
      expect(mockDb.execAsync).toHaveBeenCalled()
    })

    it('вызывает execAsync для каждой таблицы и индекса (минимум 8 раз)', async () => {
      // 4 таблицы + 4 индекса = 8
      const mockDb = await mockOpenDatabase.mock.results[0].value
      expect(mockDb.execAsync.mock.calls.length).toBeGreaterThanOrEqual(8)
    })

    it('возвращает объект базы данных', async () => {
      expect(db).toBeDefined()
      expect(db).not.toBeNull()
    })
  })

  describe('saveTask', () => {
    it('вызывает runAsync один раз', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 5)
      expect(db.runAsync).toHaveBeenCalledTimes(1)
    })

    it('передаёт id задачи первым параметром в runAsync', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 5)
      const [, params] = (db.runAsync as jest.Mock).mock.calls[0]
      expect(params[0]).toBe('aB3cD')
    })

    it('передаёт title вторым параметром', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 5)
      const [, params] = (db.runAsync as jest.Mock).mock.calls[0]
      expect(params[1]).toBe('Тестовая задача')
    })

    it('сериализует tags как JSON строку', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 5)
      const [, params] = (db.runAsync as jest.Mock).mock.calls[0]
      // tags — index 12
      expect(params[12]).toBe(JSON.stringify(['работа', 'тест']))
    })

    it('сериализует customProps как JSON строку', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 5)
      const [, params] = (db.runAsync as jest.Mock).mock.calls[0]
      // custom_props — 19-й параметр (index 18)
      expect(params[18]).toBe(JSON.stringify({ energy: 'high' }))
    })

    it('передаёт filePath и lineNum', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 42)
      const [, params] = (db.runAsync as jest.Mock).mock.calls[0]
      expect(params[20]).toBe('backlog.md')
      expect(params[21]).toBe(42)
    })

    it('SQL содержит ON CONFLICT(id) DO UPDATE (upsert)', async () => {
      await saveTask(db, SAMPLE_TASK, 'backlog.md', 5)
      const [sql] = (db.runAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('ON CONFLICT(id) DO UPDATE')
    })
  })

  describe('getTaskById', () => {
    it('возвращает null если база пустая', async () => {
      const result = await getTaskById(db, 'aB3cD')
      expect(result).toBeNull()
    })

    it('вызывает getFirstAsync с правильным SQL и id', async () => {
      await getTaskById(db, 'aB3cD')
      expect(db.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        ['aB3cD'],
      )
    })

    it('парсит JSON поля и возвращает Task если строка найдена', async () => {
      const mockRow = {
        id: 'aB3cD', title: 'Тест', status: 'active', type: 'todo',
        priority: null, indent_level: 0,
        created: null, event: null, start: null, due: null, done: null,
        remind: '["2025-06-29T09:00"]', tags: '["работа"]',
        links: '[]', from_tasks: '[]',
        parent: null, repeat: null, desc: null,
        custom_props: '{"color":"red"}', raw: '- [ ] Тест',
      };
      (db.getFirstAsync as jest.Mock).mockResolvedValueOnce(mockRow)

      const task = await getTaskById(db, 'aB3cD')

      expect(task).not.toBeNull()
      expect(task?.id).toBe('aB3cD')
      expect(task?.tags).toEqual(['работа'])
      expect(task?.remind).toEqual(['2025-06-29T09:00'])
      expect(task?.customProps).toEqual({ color: 'red' })
    })
  })
})

describe('getAllTasks / getTasksByType / getOverdueTasks', () => {
  let db: DB

  beforeEach(async () => {
    jest.clearAllMocks()
    db = await initDatabase()
  })

  describe('getAllTasks', () => {
    it('без фильтров вызывает getAllAsync без WHERE', async () => {
      await getAllTasks(db)
      const [sql] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).not.toContain('WHERE')
    })

    it('фильтр type → SQL содержит WHERE и type IN', async () => {
      await getAllTasks(db, { type: ['todo'] })
      const [sql, params] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('WHERE')
      expect(sql).toContain('type IN')
      expect(params).toContain('todo')
    })

    it('фильтр status → SQL содержит status IN', async () => {
      await getAllTasks(db, { status: ['active', 'in_progress'] })
      const [sql, params] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('status IN')
      expect(params).toContain('active')
      expect(params).toContain('in_progress')
    })

    it('фильтр dueBefore → SQL содержит due <', async () => {
      await getAllTasks(db, { dueBefore: '2025-07-01' })
      const [sql, params] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('due <')
      expect(params).toContain('2025-07-01')
    })

    it('фильтр tags → SQL содержит json_each', async () => {
      await getAllTasks(db, { tags: ['работа'] })
      const [sql, params] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('json_each')
      expect(params).toContain('работа')
    })

    it('несколько фильтров комбинируются через AND', async () => {
      await getAllTasks(db, { type: ['todo'], status: ['active'] })
      const [sql] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('AND')
    })

    it('пустой результат возвращает пустой массив', async () => {
      const result = await getAllTasks(db, { type: ['todo'] })
      expect(result).toEqual([])
    })

    it('десериализует строки и возвращает Task[]', async () => {
      const mockRow = {
        id: 'aB3cD', title: 'Тест', status: 'active', type: 'todo',
        priority: 1, indent_level: 0,
        created: null, event: null, start: null, due: '2025-06-30', done: null,
        remind: '[]', tags: '["работа"]', links: '[]', from_tasks: '[]',
        parent: null, repeat: null, desc: null, custom_props: '{}',
        raw: '- [ ] Тест',
      };
      (db.getAllAsync as jest.Mock).mockResolvedValueOnce([mockRow])

      const tasks = await getAllTasks(db)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].tags).toEqual(['работа'])
      expect(tasks[0].priority).toBe(1)
    })
  })

  describe('getTasksByType', () => {
    it('вызывает getAllAsync с фильтром по типу', async () => {
      await getTasksByType(db, 'cal')
      const [sql, params] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('type IN')
      expect(params).toContain('cal')
    })

    it('пустой результат возвращает пустой массив', async () => {
      const result = await getTasksByType(db, 'Pj')
      expect(result).toEqual([])
    })
  })

  describe('getOverdueTasks', () => {
    it('вызывает getAllAsync с due < и статусом active', async () => {
      await getOverdueTasks(db, '2025-06-18')
      const [sql, params] = (db.getAllAsync as jest.Mock).mock.calls[0]
      expect(sql).toContain('due <')
      expect(sql).toContain('status IN')
      expect(params).toContain('active')
      expect(params).toContain('2025-06-18')
    })

    it('пустой результат возвращает пустой массив', async () => {
      const result = await getOverdueTasks(db, '2025-06-18')
      expect(result).toEqual([])
    })
  })
})
