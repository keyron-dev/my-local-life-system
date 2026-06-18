import { createTask, changeTaskType, completeTask, cancelTask, linkTasks } from '../src/core/taskActions'
import { Task } from '../src/types/task'
import { DB } from '../src/database/db'

const db = {} as DB

const BASE_TASK: Task = {
  id:          'aB3cD',
  title:       'Тест',
  status:      'active',
  type:        'inbox',
  indentLevel: 0,
  priority:    null,
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
  raw:         '',
  customProps: {},
}

describe('taskActions', () => {
  describe('createTask', () => {
    it('генерирует ID ровно 5 символов', () => {
      const task = createTask(db, {})
      expect(task.id).toHaveLength(5)
    })

    it('два вызова дают разные ID', () => {
      const a = createTask(db, {})
      const b = createTask(db, {})
      expect(a.id).not.toBe(b.id)
    })

    it('применяет дефолтные значения', () => {
      const task = createTask(db, {})
      expect(task.status).toBe('active')
      expect(task.type).toBe('inbox')
      expect(task.indentLevel).toBe(0)
      expect(task.links).toEqual([])
      expect(task.tags).toEqual([])
      expect(task.remind).toEqual([])
      expect(task.from).toEqual([])
      expect(task.priority).toBeNull()
    })

    it('мёржит переданные поля', () => {
      const task = createTask(db, { title: 'Новая', type: 'todo', priority: 1 })
      expect(task.title).toBe('Новая')
      expect(task.type).toBe('todo')
      expect(task.priority).toBe(1)
    })
  })

  describe('changeTaskType', () => {
    it('меняет тип задачи', () => {
      const result = changeTaskType(BASE_TASK, 'todo')
      expect(result.type).toBe('todo')
    })

    it('не меняет оригинальный объект', () => {
      changeTaskType(BASE_TASK, 'cal')
      expect(BASE_TASK.type).toBe('inbox')
    })
  })

  describe('completeTask', () => {
    it('ставит status done', () => {
      const result = completeTask(BASE_TASK)
      expect(result.status).toBe('done')
    })

    it('заполняет поле done', () => {
      const result = completeTask(BASE_TASK)
      expect(result.done).not.toBeNull()
      expect(typeof result.done).toBe('string')
    })

    it('не мутирует оригинал', () => {
      completeTask(BASE_TASK)
      expect(BASE_TASK.status).toBe('active')
      expect(BASE_TASK.done).toBeNull()
    })
  })

  describe('cancelTask', () => {
    it('ставит status cancelled', () => {
      const result = cancelTask(BASE_TASK)
      expect(result.status).toBe('cancelled')
    })

    it('заполняет поле done', () => {
      const result = cancelTask(BASE_TASK)
      expect(result.done).not.toBeNull()
    })

    it('не мутирует оригинал', () => {
      cancelTask(BASE_TASK)
      expect(BASE_TASK.status).toBe('active')
    })
  })

  describe('linkTasks', () => {
    const parent: Task = { ...BASE_TASK, id: 'pPpPp', links: [] }
    const child: Task  = { ...BASE_TASK, id: 'cCcCc', parent: null }

    it('добавляет id дочерней в links родителя', () => {
      const { parent: p } = linkTasks(parent, child)
      expect(p.links).toContain('cCcCc')
    })

    it('устанавливает parent у дочерней задачи', () => {
      const { child: c } = linkTasks(parent, child)
      expect(c.parent).toBe('pPpPp')
    })

    it('не дублирует id если вызвать дважды', () => {
      const { parent: p1 } = linkTasks(parent, child)
      const { parent: p2 } = linkTasks(p1, child)
      expect(p2.links.filter(id => id === 'cCcCc')).toHaveLength(1)
    })

    it('не мутирует оригинальные объекты', () => {
      linkTasks(parent, child)
      expect(parent.links).toEqual([])
      expect(child.parent).toBeNull()
    })
  })
})
