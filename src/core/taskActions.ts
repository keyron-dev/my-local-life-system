import { Task } from '../types/task'
import { DB } from '../database/db'

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateId(): string {
  let id = ''
  for (let i = 0; i < 5; i++) {
    id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return id
}

export function createTask(_db: DB, fields: Partial<Task>): Task {
  const base: Task = {
    id:          generateId(),
    title:       '',
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
  return { ...base, ...fields }
}

export function changeTaskType(task: Task, newType: Task['type']): Task {
  return { ...task, type: newType }
}

export function completeTask(task: Task): Task {
  return { ...task, status: 'done', done: new Date().toISOString() }
}

export function cancelTask(task: Task): Task {
  return { ...task, status: 'cancelled', done: new Date().toISOString() }
}

export function linkTasks(parent: Task, child: Task): { parent: Task; child: Task } {
  const alreadyLinked = parent.links.includes(child.id ?? '')
  return {
    parent: alreadyLinked ? { ...parent } : { ...parent, links: [...parent.links, child.id ?? ''] },
    child:  { ...child, parent: parent.id },
  }
}
