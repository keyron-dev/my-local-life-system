import { parseLine, parseEvent } from '../src/parser/parser'

describe('parseLine', () => {
  describe('- [ ] Купить молоко [t::todo] [id::aB3cD] [due::2025-03-01] [tags::магазин,дом]', () => {
    const line = '- [ ] Купить молоко [t::todo] [id::aB3cD] [due::2025-03-01] [tags::магазин,дом]'
    const task = parseLine(line)

    it('не возвращает null', () => {
      expect(task).not.toBeNull()
    })

    it('title = "Купить молоко"', () => {
      expect(task?.title).toBe('Купить молоко')
    })

    it('status = active', () => {
      expect(task?.status).toBe('active')
    })

    it('type = todo', () => {
      expect(task?.type).toBe('todo')
    })

    it('id = aB3cD', () => {
      expect(task?.id).toBe('aB3cD')
    })

    it('due = 2025-03-01', () => {
      expect(task?.due).toBe('2025-03-01')
    })

    it('tags = [магазин, дом]', () => {
      expect(task?.tags).toEqual(['магазин', 'дом'])
    })

    it('raw = оригинальная строка', () => {
      expect(task?.raw).toBe(line)
    })

    it('customProps пустой', () => {
      expect(task?.customProps).toEqual({})
    })
  })

  describe('- [x] Сделанная задача [t::Pj] [id::xK9mP]', () => {
    const line = '- [x] Сделанная задача [t::Pj] [id::xK9mP]'
    const task = parseLine(line)

    it('status = done', () => {
      expect(task?.status).toBe('done')
    })

    it('type = Pj', () => {
      expect(task?.type).toBe('Pj')
    })

    it('title = "Сделанная задача"', () => {
      expect(task?.title).toBe('Сделанная задача')
    })

    it('id = xK9mP', () => {
      expect(task?.id).toBe('xK9mP')
    })
  })

  describe('- [-] Отменённая [t::cal]', () => {
    const line = '- [-] Отменённая [t::cal]'
    const task = parseLine(line)

    it('status = cancelled', () => {
      expect(task?.status).toBe('cancelled')
    })

    it('type = cal', () => {
      expect(task?.type).toBe('cal')
    })

    it('title = "Отменённая"', () => {
      expect(task?.title).toBe('Отменённая')
    })
  })

  describe('- [/] В процессе [t::todo] [id::zZ1aA]', () => {
    const line = '- [/] В процессе [t::todo] [id::zZ1aA]'
    const task = parseLine(line)

    it('status = in_progress', () => {
      expect(task?.status).toBe('in_progress')
    })

    it('type = todo', () => {
      expect(task?.type).toBe('todo')
    })

    it('id = zZ1aA', () => {
      expect(task?.id).toBe('zZ1aA')
    })
  })

  describe('Просто инбокс без чекбокса', () => {
    const line = 'Просто инбокс без чекбокса'

    it('возвращает inbox задачу для plain text', () => {
      const result = parseLine('Просто инбокс без чекбокса')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('inbox')
      expect(result?.title).toBe('Просто инбокс без чекбокса')
      expect(result?.status).toBe('active')
    })
  })

  describe('- [ ] Без типа вообще', () => {
    const line = '- [ ] Без типа вообще'
    const task = parseLine(line)

    it('не возвращает null', () => {
      expect(task).not.toBeNull()
    })

    it('type = inbox (нет [t::])', () => {
      expect(task?.type).toBe('inbox')
    })

    it('status = active', () => {
      expect(task?.status).toBe('active')
    })

    it('title = "Без типа вообще"', () => {
      expect(task?.title).toBe('Без типа вообще')
    })

    it('id = null', () => {
      expect(task?.id).toBeNull()
    })

    it('tags = []', () => {
      expect(task?.tags).toEqual([])
    })
  })

  describe('поля по умолчанию', () => {
    const task = parseLine('- [ ] Задача [t::todo]')!

    it('remind = []', () => expect(task.remind).toEqual([]))
    it('links = []', () => expect(task.links).toEqual([]))
    it('from = []', () => expect(task.from).toEqual([]))
    it('created = null', () => expect(task.created).toBeNull())
    it('event = null', () => expect(task.event).toBeNull())
    it('start = null', () => expect(task.start).toBeNull())
    it('done = null', () => expect(task.done).toBeNull())
    it('priority = null', () => expect(task.priority).toBeNull())
    it('parent = null', () => expect(task.parent).toBeNull())
    it('repeat = null', () => expect(task.repeat).toBeNull())
    it('desc = null', () => expect(task.desc).toBeNull())
  })

  describe('customProps', () => {
    const line = '- [ ] Задача [t::todo] [color::red] [project::alpha]'
    const task = parseLine(line)!

    it('неизвестные ключи попадают в customProps', () => {
      expect(task.customProps).toEqual({ color: 'red', project: 'alpha' })
    })

    it('встроенные ключи не дублируются в customProps', () => {
      expect(task.customProps).not.toHaveProperty('t')
    })
  })

  // ─── Новые тесты ──────────────────────────────────────────────────────────

  describe('// это комментарий', () => {
    it('возвращает null', () => {
      expect(parseLine('// это комментарий')).toBeNull()
    })

    it('возвращает null для любой строки с //', () => {
      expect(parseLine('// TODO: fix later')).toBeNull()
    })
  })

  describe('- просто инбокс без чекбокса', () => {
    const line = '- просто инбокс без чекбокса'
    const task = parseLine(line)

    it('не возвращает null', () => {
      expect(task).not.toBeNull()
    })

    it('status = active', () => {
      expect(task?.status).toBe('active')
    })

    it('type = inbox', () => {
      expect(task?.type).toBe('inbox')
    })

    it('title = "просто инбокс без чекбокса"', () => {
      expect(task?.title).toBe('просто инбокс без чекбокса')
    })

    it('raw = оригинальная строка', () => {
      expect(task?.raw).toBe(line)
    })
  })

  describe('просто текст инбокс (без "- ")', () => {
    const line = 'просто текст инбокс'
    const task = parseLine(line)

    it('не возвращает null', () => {
      expect(task).not.toBeNull()
    })

    it('status = active', () => {
      expect(task?.status).toBe('active')
    })

    it('type = inbox', () => {
      expect(task?.type).toBe('inbox')
    })

    it('title = "просто текст инбокс"', () => {
      expect(task?.title).toBe('просто текст инбокс')
    })

    it('raw = оригинальная строка', () => {
      expect(task?.raw).toBe(line)
    })
  })

  describe('- [ ] Задача с описанием [t::todo] ^[Строка 1<br>Строка 2]', () => {
    const line = '- [ ] Задача с описанием [t::todo] ^[Строка 1<br>Строка 2]'
    const task = parseLine(line)

    it('не возвращает null', () => {
      expect(task).not.toBeNull()
    })

    it('desc содержит текст описания', () => {
      expect(task?.desc).toBe('Строка 1<br>Строка 2')
    })

    it('title не содержит ^[...]', () => {
      expect(task?.title).toBe('Задача с описанием')
    })

    it('type = todo (пропсы парсятся корректно)', () => {
      expect(task?.type).toBe('todo')
    })

    it('status = active', () => {
      expect(task?.status).toBe('active')
    })

    it('raw = оригинальная строка (с ^[...])', () => {
      expect(task?.raw).toBe(line)
    })
  })

  describe('пустая строка', () => {
    it('возвращает null', () => {
      expect(parseLine('')).toBeNull()
    })

    it('возвращает null для строки из пробелов', () => {
      expect(parseLine('   ')).toBeNull()
    })
  })

  describe('indentLevel', () => {
    it('уровень 0 — нет отступа', () => {
      expect(parseLine('- [ ] Задача без отступа [t::todo]')?.indentLevel).toBe(0)
    })

    it('уровень 1 — 4 пробела', () => {
      expect(parseLine('    - [ ] Дочерняя задача [t::todo]')?.indentLevel).toBe(1)
    })

    it('уровень 2 — 8 пробелов', () => {
      expect(parseLine('        - [ ] Внучка [t::todo]')?.indentLevel).toBe(2)
    })

    it('уровень 1 — таб (таб = 4 пробела)', () => {
      expect(parseLine('\t- [ ] Вложенная через таб [t::todo]')?.indentLevel).toBe(1)
    })
  })
})

describe('parseEvent', () => {
  it('возвращает null для пустой строки', () => {
    expect(parseEvent('')).toBeNull()
  })

  it('весь день — только дата', () => {
    expect(parseEvent('2025-03-10')).toEqual({
      start: '2025-03-10',
      end: null,
      isAllDay: true,
    })
  })

  it('момент — дата и время', () => {
    expect(parseEvent('2025-03-10T10:00')).toEqual({
      start: '2025-03-10T10:00',
      end: null,
      isAllDay: false,
    })
  })

  it('полный интервал', () => {
    expect(parseEvent('2025-03-10T10:00/2025-03-10T18:00')).toEqual({
      start: '2025-03-10T10:00',
      end: '2025-03-10T18:00',
      isAllDay: false,
    })
  })

  it('короткая запись — тот же день', () => {
    expect(parseEvent('2025-03-10T10:00/18:00')).toEqual({
      start: '2025-03-10T10:00',
      end: '2025-03-10T18:00',
      isAllDay: false,
    })
  })

  it('многодневное', () => {
    expect(parseEvent('2025-03-10/2025-03-12')).toEqual({
      start: '2025-03-10',
      end: '2025-03-12',
      isAllDay: true,
    })
  })

  it('parseLine проставляет parsedEvent для задачи с event', () => {
    const task = parseLine('- [ ] Встреча [t::cal] [event::2025-03-10T10:00/18:00]')
    expect(task?.parsedEvent).toEqual({
      start: '2025-03-10T10:00',
      end: '2025-03-10T18:00',
      isAllDay: false,
    })
  })

  it('parseLine оставляет parsedEvent null без event', () => {
    const task = parseLine('- [ ] Обычная задача [t::todo]')
    expect(task?.parsedEvent).toBeNull()
  })
})

describe('dgWho и dgWhen', () => {
  const line = '- [ ] Позвонить клиенту [t::dg] [id::aB3cD] [dgWho::Иван] [dgWhen::2025-03-01]'
  const task = parseLine(line)

  it('dgWho = Иван', () => {
    expect(task?.dgWho).toBe('Иван')
  })

  it('dgWhen = 2025-03-01', () => {
    expect(task?.dgWhen).toBe('2025-03-01')
  })

  it('dgWho и dgWhen не попадают в customProps', () => {
    expect(task?.customProps).not.toHaveProperty('dgWho')
    expect(task?.customProps).not.toHaveProperty('dgWhen')
  })
})
