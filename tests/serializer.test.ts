import { serializeTask } from '../src/parser/serializer'
import { parseLine } from '../src/parser/parser'
import { Task } from '../src/types/task'

// Canonical full task for round-trip tests
const FULL_TASK: Task = {
  id:          'aB3cD',
  title:       'Купить молоко',
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
  tags:        ['магазин', 'дом'],
  links:       [],
  from:        [],
  parent:      null,
  repeat:      null,
  desc:        null,
  raw:         '',
  customProps: {},
}

/** Round-trip: serialize → parseLine → compare fields (excluding raw) */
function roundTrip(task: Task): Task | null {
  const line = serializeTask(task)
  return parseLine(line)
}

describe('serializeTask', () => {
  describe('round-trip: serialize → parseLine возвращает идентичный объект', () => {
    it('полная задача с todo', () => {
      const result = roundTrip(FULL_TASK)!
      expect(result).not.toBeNull()
      expect(result.id).toBe(FULL_TASK.id)
      expect(result.title).toBe(FULL_TASK.title)
      expect(result.status).toBe(FULL_TASK.status)
      expect(result.type).toBe(FULL_TASK.type)
      expect(result.due).toBe(FULL_TASK.due)
      expect(result.tags).toEqual(FULL_TASK.tags)
      expect(result.remind).toEqual(FULL_TASK.remind)
      expect(result.priority).toBe(FULL_TASK.priority)
      expect(result.created).toBe(FULL_TASK.created)
    })

    it('задача со статусом done', () => {
      const task: Task = { ...FULL_TASK, status: 'done', done: '2025-06-15' }
      const result = roundTrip(task)!
      expect(result.status).toBe('done')
      expect(result.done).toBe('2025-06-15')
    })

    it('задача со статусом cancelled', () => {
      const result = roundTrip({ ...FULL_TASK, status: 'cancelled' })!
      expect(result.status).toBe('cancelled')
    })

    it('задача со статусом in_progress', () => {
      const result = roundTrip({ ...FULL_TASK, status: 'in_progress' })!
      expect(result.status).toBe('in_progress')
    })

    it('задача с customProps', () => {
      const task: Task = { ...FULL_TASK, customProps: { energy: 'high', color: 'red' } }
      const result = roundTrip(task)!
      expect(result.customProps).toEqual({ energy: 'high', color: 'red' })
    })

    it('задача с parent', () => {
      const task: Task = { ...FULL_TASK, parent: 'xYz12' }
      const result = roundTrip(task)!
      expect(result.parent).toBe('xYz12')
    })

    it('задача с repeat', () => {
      const task: Task = { ...FULL_TASK, repeat: 'mon' }
      const result = roundTrip(task)!
      expect(result.repeat).toBe('mon')
    })

    it('задача с типом Pj', () => {
      const task: Task = { ...FULL_TASK, type: 'Pj' }
      const result = roundTrip(task)!
      expect(result.type).toBe('Pj')
    })
  })

  describe('inbox без свойств → "- title"', () => {
    it('чистый inbox сериализуется без чекбокса', () => {
      const task: Task = {
        ...FULL_TASK,
        type: 'inbox', id: null, created: null, due: null,
        remind: [], tags: [], priority: null, parent: null,
        repeat: null, desc: null, customProps: {},
      }
      const line = serializeTask(task)
      expect(line).toBe(`- ${task.title}`)
    })

    it('inbox с id → получает чекбокс', () => {
      const task: Task = { ...FULL_TASK, type: 'inbox' }
      const line = serializeTask(task)
      expect(line).toContain('- [ ]')
    })
  })

  describe('отступы', () => {
    it('indentLevel 0 → без отступа', () => {
      const line = serializeTask({ ...FULL_TASK, indentLevel: 0 })
      expect(line).toMatch(/^- /)
    })

    it('indentLevel 1 → начинается с 4 пробелов', () => {
      const line = serializeTask({ ...FULL_TASK, indentLevel: 1 })
      expect(line).toMatch(/^    - /)
    })

    it('indentLevel 2 → начинается с 8 пробелов', () => {
      const line = serializeTask({ ...FULL_TASK, indentLevel: 2 })
      expect(line.startsWith('        ')).toBe(true)
    })

    it('round-trip с indentLevel 2', () => {
      const task: Task = { ...FULL_TASK, indentLevel: 2 }
      const result = roundTrip(task)!
      expect(result.indentLevel).toBe(2)
      expect(result.title).toBe(task.title)
    })
  })

  describe('desc', () => {
    it('задача с desc → заканчивается на ^[...]', () => {
      const task: Task = { ...FULL_TASK, desc: 'Строка 1<br>Строка 2' }
      const line = serializeTask(task)
      expect(line.endsWith('^[Строка 1<br>Строка 2]')).toBe(true)
    })

    it('round-trip с desc', () => {
      const task: Task = { ...FULL_TASK, desc: 'Первый шаг<br>Второй шаг' }
      const result = roundTrip(task)!
      expect(result.desc).toBe('Первый шаг<br>Второй шаг')
    })

    it('задача без desc → не содержит ^[', () => {
      const line = serializeTask({ ...FULL_TASK, desc: null })
      expect(line).not.toContain('^[')
    })
  })

  describe('пустые/null поля не попадают в строку', () => {
    it('null поля не сериализуются', () => {
      const task: Task = {
        ...FULL_TASK,
        event: null, start: null, done: null, parent: null, repeat: null,
      }
      const line = serializeTask(task)
      expect(line).not.toContain('[event::')
      expect(line).not.toContain('[start::')
      expect(line).not.toContain('[done::')
      expect(line).not.toContain('[parent::')
      expect(line).not.toContain('[repeat::')
    })

    it('пустые массивы не сериализуются', () => {
      const task: Task = { ...FULL_TASK, remind: [], tags: [], links: [] }
      const line = serializeTask(task)
      expect(line).not.toContain('[remind::')
      expect(line).not.toContain('[tags::')
      expect(line).not.toContain('[links::')
    })
  })
})
