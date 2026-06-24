import { Task } from '../types/task'
import { DB, getTaskById } from '../database/db'

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
    attach:      [],
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

export async function deleteTask(db: DB, id: string): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id])
}

export function unlinkTasks(
  parent: Task,
  child: Task,
): { parent: Task; child: Task } {
  return {
    parent: { ...parent, links: parent.links.filter(id => id !== child.id) },
    child:  { ...child, parent: child.parent === parent.id ? null : child.parent },
  }
}

export function updateTaskProperties(task: Task, changes: Partial<Task>): Task {
  return { ...task, ...changes }
}

export async function getLinkedTasks(db: DB, taskId: string): Promise<Task[]> {
  const task = await getTaskById(db, taskId)
  if (!task) return []

  const results: Task[] = []
  const seen = new Set<string>()

  for (const linkedId of task.links) {
    if (seen.has(linkedId)) continue
    seen.add(linkedId)
    const linked = await getTaskById(db, linkedId)
    if (linked) results.push(linked)
  }

  return results
}
