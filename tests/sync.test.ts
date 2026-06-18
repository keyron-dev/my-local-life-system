import { indexFile, syncTaskToFile, markTaskDone, getFileForType } from '../src/sync/sync'
import { Task } from '../src/types/task'

// ── Minimal DB mock ───────────────────────────────────────────────────────────

function makeMockDb() {
  return {
    execAsync:    jest.fn().mockResolvedValue(undefined),
    runAsync:     jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync:   jest.fn().mockResolvedValue([]),
  } as any
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TASK: Task = {
  id:          'aB3cD',
  title:       'Купить молоко',
  status:      'active',
  type:        'todo',
  priority:    null,
  indentLevel: 0,
  created:     null,
  event:       null,
  start:       null,
  due:         null,
  done:        null,
  remind:      [],
  tags:        [],
  links:       [],
  from:        [],
  parent:      null,
  repeat:      null,
  desc:        null,
  raw:         '- [ ] Купить молоко [t::todo] [id::aB3cD]',
  customProps: {},
}

const FILE_CONTENT = [
  '- [ ] Первая [t::todo] [id::AAA11]',
  '- [ ] Вторая [t::todo] [id::BBB22]',
  '- [ ] Купить молоко [t::todo] [id::aB3cD]',
  '- [ ] Четвёртая [t::todo] [id::CCC33]',
].join('\n')

// ── indexFile ─────────────────────────────────────────────────────────────────

describe('indexFile', () => {
  it('вызывает saveTask для каждой задачи в файле', async () => {
    const db = makeMockDb()
    await indexFile(db, 'backlog.md', FILE_CONTENT)
    expect(db.runAsync).toHaveBeenCalledTimes(4)
  })

  it('передаёт правильный filePath в saveTask', async () => {
    const db = makeMockDb()
    await indexFile(db, 'backlog.md', FILE_CONTENT)
    // filePath — 21-й параметр (index 20) в runAsync
    for (const call of db.runAsync.mock.calls) {
      expect(call[1][20]).toBe('backlog.md')
    }
  })

  it('передаёт корректный lineNum (0-based) для каждой задачи', async () => {
    const db = makeMockDb()
    await indexFile(db, 'backlog.md', FILE_CONTENT)
    // lineNum — 22-й параметр (index 21)
    const lineNums = db.runAsync.mock.calls.map((c: any) => c[1][21])
    expect(lineNums).toContain(0)
    expect(lineNums).toContain(1)
    expect(lineNums).toContain(2)
    expect(lineNums).toContain(3)
  })

  it('не вызывает saveTask для пустого файла', async () => {
    const db = makeMockDb()
    await indexFile(db, 'backlog.md', '')
    expect(db.runAsync).not.toHaveBeenCalled()
  })

  it('не вызывает saveTask для комментариев и пустых строк', async () => {
    const db = makeMockDb()
    const content = '// комментарий\n\n- [ ] Задача [t::todo] [id::AAA11]'
    await indexFile(db, 'backlog.md', content)
    expect(db.runAsync).toHaveBeenCalledTimes(1)
  })
})

// ── syncTaskToFile ─────────────────────────────────────────────────────────────

describe('syncTaskToFile', () => {
  it('обновляет строку если ID найден', () => {
    const db = makeMockDb()
    const updated = syncTaskToFile(db, { ...TASK, status: 'done', done: '2025-06-18' }, FILE_CONTENT)
    const lines = updated.split('\n')
    expect(lines[2]).toContain('[id::aB3cD]')
    expect(lines[2]).toContain('[done::2025-06-18]')
  })

  it('не меняет количество строк при обновлении', () => {
    const db = makeMockDb()
    const before = FILE_CONTENT.split('\n').length
    const result = syncTaskToFile(db, TASK, FILE_CONTENT)
    expect(result.split('\n').length).toBe(before)
  })

  it('не трогает другие строки при обновлении', () => {
    const db = makeMockDb()
    const result = syncTaskToFile(db, { ...TASK, title: 'Изменённый заголовок' }, FILE_CONTENT)
    const lines = result.split('\n')
    expect(lines[0]).toBe('- [ ] Первая [t::todo] [id::AAA11]')
    expect(lines[3]).toBe('- [ ] Четвёртая [t::todo] [id::CCC33]')
  })

  it('добавляет строку в конец если ID не найден', () => {
    const db = makeMockDb()
    const newTask: Task = { ...TASK, id: 'ZZZ99', title: 'Новая задача', raw: '' }
    const result = syncTaskToFile(db, newTask, FILE_CONTENT)
    const lines = result.split('\n')
    expect(lines[lines.length - 1]).toContain('[id::ZZZ99]')
  })

  it('добавляет строку в конец если ID не найден — число строк +1', () => {
    const db = makeMockDb()
    const newTask: Task = { ...TASK, id: 'ZZZ99', title: 'Новая задача', raw: '' }
    const before = FILE_CONTENT.split('\n').length
    const result = syncTaskToFile(db, newTask, FILE_CONTENT)
    expect(result.split('\n').length).toBe(before + 1)
  })

  it('задача без id → append в конец', () => {
    const db = makeMockDb()
    const noId: Task = { ...TASK, id: null, raw: '' }
    const before = FILE_CONTENT.split('\n').length
    const result = syncTaskToFile(db, noId, FILE_CONTENT)
    expect(result.split('\n').length).toBe(before + 1)
  })
})

// ── markTaskDone ──────────────────────────────────────────────────────────────

describe('markTaskDone', () => {
  it('возвращает задачу со статусом done', () => {
    const result = markTaskDone(TASK)
    expect(result.status).toBe('done')
  })

  it('заполняет поле done датой ISO', () => {
    const before = new Date().toISOString()
    const result = markTaskDone(TASK)
    const after = new Date().toISOString()
    expect(result.done).not.toBeNull()
    expect(result.done! >= before).toBe(true)
    expect(result.done! <= after).toBe(true)
  })

  it('не мутирует оригинальную задачу', () => {
    markTaskDone(TASK)
    expect(TASK.status).toBe('active')
    expect(TASK.done).toBeNull()
  })

  it('сохраняет остальные поля без изменений', () => {
    const result = markTaskDone(TASK)
    expect(result.id).toBe(TASK.id)
    expect(result.title).toBe(TASK.title)
    expect(result.type).toBe(TASK.type)
    expect(result.tags).toEqual(TASK.tags)
  })
})

// ── getFileForType ────────────────────────────────────────────────────────────

describe('getFileForType', () => {
  const cases: [Task['type'], string][] = [
    ['inbox', 'inbox.md'],
    ['todo',  'backlog.md'],
    ['cal',   'calendar.md'],
    ['Pj',    'projects.md'],
    ['id',    'ideas.md'],
    ['nt',    'notes.md'],
    ['dg',    'delegated.md'],
    ['sdl',   'someday.md'],
  ]

  for (const [type, file] of cases) {
    it(`${type} → ${file}`, () => {
      expect(getFileForType(type)).toBe(file)
    })
  }
})
