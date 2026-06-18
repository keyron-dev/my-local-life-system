import { Task } from '../types/task'
import { parseLine } from './parser'

export function parseFile(content: string): Task[] {
  const lines = content.split('\n')
  const tasks: Task[] = []

  // Стек: индекс = уровень отступа, значение = последняя задача на этом уровне
  const stack: Task[] = []

  for (const line of lines) {
    const task = parseLine(line)
    if (task === null) continue

    const level = task.indentLevel

    // Заполнить parent/links только если parent не задан явно через [parent::]
    if (task.parent === null && level > 0) {
      const parentTask = stack[level - 1]
      if (parentTask) {
        task.parent = parentTask.id
        if (task.id !== null) {
          parentTask.links.push(task.id)
        }
      }
    }

    // Записать задачу в стек на своём уровне и обрезать всё глубже
    stack[level] = task
    stack.length = level + 1

    tasks.push(task)
  }

  return tasks
}
